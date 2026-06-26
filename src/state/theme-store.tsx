// The editing state container for the theme generator.
//
// Holds the working ThemeDoc, the active base preset id, and the selected sample
// language. Hydrates from URL (?t=) then localStorage then the default preset, and
// debounce-persists every edit back to both the URL and localStorage.

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
import { decodeFromParam, encodeToParam, loadLocal, saveLocal } from "../theme/serialize.ts";
import type { MappingValue, ThemeDoc } from "../theme/types.ts";

export type LanguageId = "elisp" | "typescript";

interface State {
  doc: ThemeDoc;
  baseId: string;
  language: LanguageId;
}

type Action =
  | { type: "setColor"; key: ColorKey; hex: string }
  | { type: "setMapping"; role: RoleKey; value: MappingValue }
  | { type: "setMeta"; patch: Partial<ThemeDoc["meta"]> }
  | { type: "loadPreset"; presetId: string }
  | { type: "setLanguage"; language: LanguageId }
  | { type: "reset" };

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
    default:
      return state;
  }
}

function initState(): State {
  const fromUrl = readUrlParam();
  const loaded = fromUrl ?? loadLocal();
  if (loaded) {
    return { doc: loaded.doc, baseId: loaded.baseId, language: "elisp" };
  }
  const preset = getPreset(DEFAULT_PRESET_ID)!;
  return { doc: cloneDoc(preset.doc), baseId: preset.id, language: "elisp" };
}

function readUrlParam(): { doc: ThemeDoc; baseId: string } | null {
  if (typeof window === "undefined") return null;
  const param = new URLSearchParams(window.location.search).get("t");
  return param ? decodeFromParam(param) : null;
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
  /** A shareable URL encoding the current theme. */
  shareUrl: () => string;
}

const ThemeStoreContext = createContext<StoreApi | null>(null);

export function ThemeStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced persistence to localStorage + URL on every change.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveLocal(state.doc, state.baseId);
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
