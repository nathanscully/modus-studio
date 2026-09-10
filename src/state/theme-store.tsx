// The editing state container for the theme generator.
//
// Holds the working ThemeSpec (the author's model: base colors, mapping
// overrides, core), the active base preset id, and the selected sample
// language. The expanded ThemeDoc the preview and exporter read is derived from
// the spec with `expandSpec`, the same math Emacs runs at load time. The route
// owns seeding: it passes the `$themeId` preset and an optional `?t=` diff
// param. A `?t=` param wins; otherwise the spec is a fresh clone of that
// preset's. The per-theme URL is the source of truth: every edit is
// debounce-persisted to the URL so refresh/share round-trips.

import { toast } from "sonner";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import type { ColorKey, RoleKey } from "../theme/palette-keys.ts";
import { cloneSpec, DEFAULT_PRESET_ID, getPreset } from "../theme/presets.ts";
import { decodeFromParam, encodeToParam } from "../theme/serialize.ts";
import { expandSpec } from "../theme/theme-file.ts";
import type { MappingValue, Preset, ThemeDoc, ThemeMeta, ThemeSpec } from "../theme/types.ts";

export type LanguageId = "elisp" | "typescript" | "python" | "rust";

interface State {
  spec: ThemeSpec;
  baseId: string;
  language: LanguageId;
  /** Set when a `?t=` param was present but did not decode for this base. */
  rejectedParam: boolean;
}

type Action =
  | { type: "setColor"; key: ColorKey; hex: string }
  | { type: "setMapping"; role: RoleKey; value: MappingValue }
  | { type: "revert"; key: string }
  | { type: "setMeta"; patch: Partial<ThemeMeta> }
  | { type: "loadPreset"; presetId: string }
  | { type: "setLanguage"; language: LanguageId }
  | { type: "reset" }
  | { type: "restore"; spec: ThemeSpec };

function basePreset(state: State): Preset {
  return getPreset(state.baseId) ?? getPreset(DEFAULT_PRESET_ID)!;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setColor": {
      const spec = cloneSpec(state.spec);
      spec.colors[action.key] = action.hex;
      return { ...state, spec };
    }
    case "setMapping": {
      const spec = cloneSpec(state.spec);
      spec.mappings[action.role] = action.value;
      return { ...state, spec };
    }
    case "revert": {
      // Put one key back to what the base preset says, in whichever layer the
      // preset keeps it; a key the preset never set is dropped.
      const base = basePreset(state).spec;
      const spec = cloneSpec(state.spec);
      const colors = spec.colors as Record<string, string | undefined>;
      const mappings = spec.mappings as Record<string, MappingValue | undefined>;
      const baseColor = (base.colors as Record<string, string | undefined>)[action.key];
      const baseMapping = (base.mappings as Record<string, MappingValue | undefined>)[action.key];
      if (baseColor == null) delete colors[action.key];
      else colors[action.key] = baseColor;
      if (baseMapping == null) delete mappings[action.key];
      else mappings[action.key] = baseMapping;
      return { ...state, spec };
    }
    case "setMeta": {
      const spec = cloneSpec(state.spec);
      spec.meta = { ...spec.meta, ...action.patch };
      return { ...state, spec };
    }
    case "loadPreset": {
      const preset = getPreset(action.presetId);
      if (!preset) return state;
      return { ...state, spec: cloneSpec(preset.spec), baseId: preset.id };
    }
    case "setLanguage":
      return { ...state, language: action.language };
    case "reset":
      return { ...state, spec: cloneSpec(basePreset(state).spec) };
    case "restore":
      return { ...state, spec: cloneSpec(action.spec) };
    default:
      return state;
  }
}

function initState(presetId: string, param: string | undefined): State {
  // A shared-edit param wins, provided it decodes to the same base we're seeding.
  if (param) {
    const fromUrl = decodeFromParam(param);
    if (fromUrl && fromUrl.baseId === presetId) {
      return {
        spec: fromUrl.spec,
        baseId: fromUrl.baseId,
        language: "elisp",
        rejectedParam: false,
      };
    }
  }
  const preset = getPreset(presetId) ?? getPreset(DEFAULT_PRESET_ID)!;
  return {
    spec: cloneSpec(preset.spec),
    baseId: preset.id,
    language: "elisp",
    rejectedParam: param != null,
  };
}

/** One edit relative to the base preset: which key changed and in which layer. */
export interface SpecChange {
  kind: "color" | "mapping";
  key: string;
}

/** The keys whose value in `spec` differs from the base preset's spec, colors first. */
export function specChanges(spec: ThemeSpec, base: ThemeSpec): SpecChange[] {
  const out: SpecChange[] = [];
  const baseColors = base.colors as Record<string, string | undefined>;
  const baseMappings = base.mappings as Record<string, MappingValue | undefined>;
  for (const [k, v] of Object.entries(spec.colors)) {
    if (v != null && v !== baseColors[k]) out.push({ kind: "color", key: k });
  }
  for (const [k, v] of Object.entries(spec.mappings)) {
    if (v != null && v !== baseMappings[k]) out.push({ kind: "mapping", key: k });
  }
  return out;
}

interface StoreApi {
  /** The author-style working theme: base colors, mapping overrides, core. */
  spec: ThemeSpec;
  /** The expanded theme the preview and exporter read, derived from `spec`. */
  doc: ThemeDoc;
  /** The preset the working theme started from. */
  preset: Preset;
  baseId: string;
  language: LanguageId;
  setColor: (key: ColorKey, hex: string) => void;
  setMapping: (role: RoleKey, value: MappingValue) => void;
  /** Put one color or mapping back to the base preset's value. */
  revert: (key: string) => void;
  setMeta: (patch: Partial<ThemeMeta>) => void;
  loadPreset: (presetId: string) => void;
  setLanguage: (language: LanguageId) => void;
  reset: () => void;
  /** Replace the working spec wholesale (used to undo a reset). */
  restore: (spec: ThemeSpec) => void;
  /** A shareable URL encoding the current theme. */
  shareUrl: () => string;
}

const ThemeStoreContext = createContext<StoreApi | null>(null);

interface ThemeStoreProviderProps {
  children: ReactNode;
  /** Base preset id to seed from (the /theme/$themeId route param). */
  initialPresetId: string;
  /** Optional `?t=` diff param; wins over the plain seed when it matches. */
  initialParam?: string;
}

export function ThemeStoreProvider({
  children,
  initialPresetId,
  initialParam,
}: ThemeStoreProviderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initState(initialPresetId, initialParam),
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A shared link whose `?t=` param did not decode for this base falls back to
  // the plain preset; say so once instead of silently dropping the edits.
  useEffect(() => {
    if (!state.rejectedParam) return;
    toast.warning("Could not load the shared edits", {
      description: "The link's theme data did not match this theme, so it opened unedited.",
    });
  }, [state.rejectedParam]);

  // Debounced persistence of every edit into the URL's `?t=` diff param, so a
  // refresh or copied link round-trips the working theme. The per-theme URL is
  // the single source of truth.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const param = encodeToParam(state.spec, state.baseId);
      const url = new URL(window.location.href);
      url.searchParams.set("t", param);
      window.history.replaceState(null, "", url);
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state.spec, state.baseId]);

  // The action callbacks depend ONLY on the (stable) dispatch, so their identity
  // never changes. This is essential: editor rows are React.memo'd and receive
  // these actions as `onChange` props — an unstable action would break the memo
  // and re-render all ~130/~190 rows on every single edit.
  const actions = useMemo(
    () => ({
      setColor: (key: ColorKey, hex: string) => dispatch({ type: "setColor", key, hex }),
      setMapping: (role: RoleKey, value: MappingValue) =>
        dispatch({ type: "setMapping", role, value }),
      revert: (key: string) => dispatch({ type: "revert", key }),
      setMeta: (patch: Partial<ThemeMeta>) => dispatch({ type: "setMeta", patch }),
      loadPreset: (presetId: string) => dispatch({ type: "loadPreset", presetId }),
      setLanguage: (language: LanguageId) => dispatch({ type: "setLanguage", language }),
      reset: () => dispatch({ type: "reset" }),
      restore: (spec: ThemeSpec) => dispatch({ type: "restore", spec }),
    }),
    [],
  );

  // The doc/state-derived view is rebuilt on change, but reuses the stable
  // actions above. `shareUrl` reads current state via a ref to stay stable too.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const shareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("t", encodeToParam(stateRef.current.spec, stateRef.current.baseId));
    return url.toString();
  }, []);

  const doc = useMemo(() => expandSpec(state.spec), [state.spec]);
  const preset = basePreset(state);

  const api = useMemo<StoreApi>(
    () => ({
      spec: state.spec,
      doc,
      preset,
      baseId: state.baseId,
      language: state.language,
      ...actions,
      shareUrl,
    }),
    [state.spec, doc, preset, state.baseId, state.language, actions, shareUrl],
  );

  return <ThemeStoreContext value={api}>{children}</ThemeStoreContext>;
}

export function useThemeStore(): StoreApi {
  const ctx = use(ThemeStoreContext);
  if (!ctx) throw new Error("useThemeStore must be used within ThemeStoreProvider");
  return ctx;
}
