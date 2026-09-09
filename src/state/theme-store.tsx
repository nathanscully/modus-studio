// The editing state container for the theme generator.
//
// Holds the working ThemeDoc, the active base preset id, and the selected sample
// language. The route owns seeding now: it passes the `$themeId` preset and an
// optional `?t=` diff param. A `?t=` param wins; otherwise the doc is a fresh
// clone of that preset. The per-theme URL is the source of truth: every edit is
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
import { cloneDoc, DEFAULT_PRESET_ID, getPreset } from "../theme/presets.ts";
import { decodeFromParam, encodeToParam } from "../theme/serialize.ts";
import type { MappingValue, ThemeDoc } from "../theme/types.ts";

export type LanguageId = "elisp" | "typescript";

interface State {
  doc: ThemeDoc;
  baseId: string;
  language: LanguageId;
  /** Set when a `?t=` param was present but did not decode for this base. */
  rejectedParam: boolean;
}

type Action =
  | { type: "setColor"; key: ColorKey; hex: string }
  | { type: "setMapping"; role: RoleKey; value: MappingValue }
  | { type: "setMeta"; patch: Partial<ThemeDoc["meta"]> }
  | { type: "loadPreset"; presetId: string }
  | { type: "setLanguage"; language: LanguageId }
  | { type: "reset" }
  | { type: "restore"; doc: ThemeDoc };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setColor": {
      const doc = cloneDoc(state.doc);
      doc.palette[action.key] = action.hex;
      return { ...state, doc };
    }
    case "setMapping": {
      const doc = cloneDoc(state.doc);
      doc.mappings[action.role] = action.value;
      return { ...state, doc };
    }
    case "setMeta": {
      const doc = cloneDoc(state.doc);
      doc.meta = { ...doc.meta, ...action.patch };
      return { ...state, doc };
    }
    case "loadPreset": {
      const preset = getPreset(action.presetId);
      if (!preset) return state;
      return { ...state, doc: cloneDoc(preset.doc), baseId: preset.id };
    }
    case "setLanguage":
      return { ...state, language: action.language };
    case "reset": {
      const preset = getPreset(state.baseId) ?? getPreset(DEFAULT_PRESET_ID)!;
      return { ...state, doc: cloneDoc(preset.doc) };
    }
    case "restore":
      return { ...state, doc: cloneDoc(action.doc) };
    default:
      return state;
  }
}

function initState(presetId: string, param: string | undefined): State {
  // A shared-edit param wins, provided it decodes to the same base we're seeding.
  if (param) {
    const fromUrl = decodeFromParam(param);
    if (fromUrl && fromUrl.baseId === presetId) {
      return { doc: fromUrl.doc, baseId: fromUrl.baseId, language: "elisp", rejectedParam: false };
    }
  }
  const preset = getPreset(presetId) ?? getPreset(DEFAULT_PRESET_ID)!;
  return {
    doc: cloneDoc(preset.doc),
    baseId: preset.id,
    language: "elisp",
    rejectedParam: param != null,
  };
}

interface StoreApi {
  doc: ThemeDoc;
  baseId: string;
  language: LanguageId;
  setColor: (key: ColorKey, hex: string) => void;
  setMapping: (role: RoleKey, value: MappingValue) => void;
  setMeta: (patch: Partial<ThemeDoc["meta"]>) => void;
  loadPreset: (presetId: string) => void;
  setLanguage: (language: LanguageId) => void;
  reset: () => void;
  /** Replace the working doc wholesale (used to undo a reset). */
  restore: (doc: ThemeDoc) => void;
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
      const param = encodeToParam(state.doc, state.baseId);
      const url = new URL(window.location.href);
      url.searchParams.set("t", param);
      window.history.replaceState(null, "", url);
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state.doc, state.baseId]);

  // The action callbacks depend ONLY on the (stable) dispatch, so their identity
  // never changes. This is essential: editor rows are React.memo'd and receive
  // these actions as `onChange` props — an unstable action would break the memo
  // and re-render all ~130/~190 rows on every single edit.
  const actions = useMemo(
    () => ({
      setColor: (key: ColorKey, hex: string) => dispatch({ type: "setColor", key, hex }),
      setMapping: (role: RoleKey, value: MappingValue) =>
        dispatch({ type: "setMapping", role, value }),
      setMeta: (patch: Partial<ThemeDoc["meta"]>) => dispatch({ type: "setMeta", patch }),
      loadPreset: (presetId: string) => dispatch({ type: "loadPreset", presetId }),
      setLanguage: (language: LanguageId) => dispatch({ type: "setLanguage", language }),
      reset: () => dispatch({ type: "reset" }),
      restore: (doc: ThemeDoc) => dispatch({ type: "restore", doc }),
    }),
    [],
  );

  // The doc/state-derived view is rebuilt on change, but reuses the stable
  // actions above. `shareUrl` reads current state via a ref to stay stable too.
  const stateRef = useRef(state);
  stateRef.current = state;
  const shareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("t", encodeToParam(stateRef.current.doc, stateRef.current.baseId));
    return url.toString();
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      doc: state.doc,
      baseId: state.baseId,
      language: state.language,
      ...actions,
      shareUrl,
    }),
    [state.doc, state.baseId, state.language, actions, shareUrl],
  );

  return <ThemeStoreContext value={api}>{children}</ThemeStoreContext>;
}

export function useThemeStore(): StoreApi {
  const ctx = use(ThemeStoreContext);
  if (!ctx) throw new Error("useThemeStore must be used within ThemeStoreProvider");
  return ctx;
}
