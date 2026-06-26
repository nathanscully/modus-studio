// Core data model for a Modus theme.
//
// A Modus theme is a two-layer palette:
//   Layer 1 — named colors:    symbol -> hex string,    e.g. (red-warmer "#972500")
//   Layer 2 — semantic mappings: role -> color name OR hex, e.g. (keyword magenta-cooler)
//
// See src/theme/palette-keys.ts for the full, category-grouped vocabulary of both
// layers. The keys here are intentionally `string`-keyed records (rather than
// exhaustive mapped types over the key unions) so that partial palettes and
// incremental edits remain ergonomic; `palette-keys.ts` is the source of truth
// for which keys exist and the order they render/serialize in.

import type { ColorKey, RoleKey } from "./palette-keys.ts";

/** Layer 1: named color -> hex string (e.g. "red-warmer" -> "#972500"). */
export type Palette = Partial<Record<ColorKey, string>>;

/**
 * Layer 2: semantic role -> a layer-1 color name OR a raw hex string OR the
 * Emacs sentinel "unspecified" (role left to inherit / not themed).
 */
export type MappingValue = ColorKey | string;
export type Mapping = Partial<Record<RoleKey, MappingValue>>;

export type ThemeMode = "light" | "dark";

export interface ThemeMeta {
  /** Theme name; becomes the symbol in (provide-theme 'NAME) and the file stem. */
  name: string;
  description: string;
  mode: ThemeMode;
}

export interface ThemeDoc {
  meta: ThemeMeta;
  palette: Palette;
  mappings: Mapping;
}

/** A bundled starting-point theme (modus-operandi / modus-vivendi for v1). */
export interface Preset {
  id: string;
  label: string;
  doc: ThemeDoc;
}
