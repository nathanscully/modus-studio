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
  /** Attribution + provenance, carried through from the theme file's meta. */
  author?: string;
  homepage?: string;
  license?: string;
  tags?: readonly string[];
}

export interface ThemeDoc {
  meta: ThemeMeta;
  palette: Palette;
  mappings: Mapping;
}

export type ThemePreference = "cool" | "warm";

/**
 * The author's model of a theme, which is what the editor edits and the
 * exporter writes. A "partial" spec holds the base colors and mapping
 * overrides an author writes by hand; `generatePalette` derives the rest from
 * the named core at view time. A "full" spec (the Modus cores, themes whose
 * palette is not generated) holds the whole palette and mapping layer as-is.
 */
export interface ThemeSpec {
  kind: "full" | "partial";
  meta: ThemeMeta;
  /** Named colors: the whole palette for "full", the author's base colors for "partial". */
  colors: Palette;
  /** Semantic mappings: the whole layer for "full", the author's overrides for "partial". */
  mappings: Mapping;
  /** The engine core palette symbol a partial fills from, e.g. modus-themes-vivendi-palette. */
  core: string;
  preference?: ThemePreference;
}

// The four built-in collections, in gallery/picker display order. Community is
// last; extra directories under themes/ default to "community".
export type Collection = "modus" | "ef" | "classic" | "community";

/** Where a resolved theme came from: the pinned upstream files it was read from. */
export interface ThemeProvenance {
  repo: string;
  rev: string;
  files: readonly string[];
  theme: string;
  url: string;
  api: "modus-5" | "modus-4";
  customFaces: number;
  install?: string;
}

/** A theme from the catalogue: its author-style spec plus the expanded doc the preview reads. */
export interface Preset {
  id: string;
  label: string;
  collection: Collection;
  spec: ThemeSpec;
  doc: ThemeDoc;
  source?: ThemeProvenance;
}
