// Solarized (Ethan Schoonover) as Modus BASE-COLORS, light + dark.
//
// Solarized is a color scheme, not a Modus theme: it defines 16 values (an
// 8-step monotone ramp + 8 accents) and nothing else. We map its canonical
// roles onto the Modus base shape (bg-main, fg-main, + the six hues) and let
// `generatePalette` derive the full ~120-color palette. This mirrors the Modus
// manual's own Solarized walkthrough (doc/modus-themes.org §10.1.4).
//
// Canonical hex values (https://github.com/altercation/solarized, matched
// verbatim by bbatsov/solarized-emacs):
//   base03 #002b36  base02 #073642  base01 #586e75  base00 #657b83
//   base0  #839496  base1  #93a1a1  base2  #eee8d5  base3  #fdf6e3
//   yellow #b58900  orange #cb4b16  red    #dc322f  magenta #d33682
//   violet #6c71c4  blue   #268bd2  cyan   #2aa198  green   #859900
//
// Schoonover's design intent: in dark, bg = base03 and fg = base0; in light,
// bg = base3 and fg = base00 (the ramp is inverted, accents are shared).
//
// We additionally transcribe solarized-emacs's OWN semantic role choices
// (solarized-faces.el) as the MAPPINGS override, so the port doesn't merely use
// Solarized colors but also LOOKS like real Solarized — keyword→green,
// fnname→blue, string→cyan, type→yellow, comment→base01, etc. Verified against
// solarized-emacs with CIEDE2000: palette ΔE 0 (identical colors) and the role
// colors now match the established port. (Without this override the same base
// would inherit Modus's arrangement — keyword→magenta — which is authentic
// Solarized color but not the Solarized people recognize.)

import type { BaseScheme } from "../types.ts";

// The six Modus hues + the two extra Solarized accents Modus's base lacks
// (orange, violet) and the two ramp steps used by faces (base01, base02). These
// extra named colors are referenced by the mappings below; the generator passes
// them through as-is and derives everything else.
const ACCENTS = {
  red: "#dc322f",
  green: "#859900",
  yellow: "#b58900",
  blue: "#268bd2",
  magenta: "#d33682",
  cyan: "#2aa198",
  // Extra Solarized named colors (not part of Modus's six-hue base).
  "yellow-warmer": "#cb4b16", // orange — used for `err`
  "magenta-cooler": "#6c71c4", // violet — used for numbers
} as const;

// solarized-emacs face → palette-color assignments (solarized-faces.el).
// These point at named colors that the generated palette resolves to Solarized
// hexes, so e.g. keyword→green→#859900 exactly as in solarized-emacs.
const MAPPINGS = {
  // Syntax
  keyword: "green",
  fnname: "blue",
  "fnname-call": "blue",
  variable: "blue",
  "variable-use": "blue",
  string: "cyan",
  type: "yellow",
  constant: "blue",
  builtin: "fg-main", // base0
  preprocessor: "blue",
  docstring: "cyan",
  number: "magenta-cooler", // violet
  // General UI
  cursor: "fg-main", // base0
  err: "yellow-warmer", // orange
  warning: "yellow",
  info: "green",
  "fg-link": "yellow",
} as const;

// Mode-dependent entries. solarized-emacs's comment uses base01 and region uses
// base02 — but those ramp steps differ between dark and light (the monotone
// ramp inverts). Map them straight to the canonical hex per mode so they're
// exact rather than relying on the derived fg-dim/bg-dim approximations.
const DARK_MAPPINGS = {
  ...MAPPINGS,
  comment: "#586e75", // base01 (dark)
  "bg-region": "#073642", // base02 (dark)
} as const;

const LIGHT_MAPPINGS = {
  ...MAPPINGS,
  comment: "#93a1a1", // base1 (light's base01-equivalent)
  "bg-region": "#eee8d5", // base2 (light's base02-equivalent)
} as const;

export const solarizedDark: BaseScheme = {
  id: "solarized-dark",
  label: "Solarized Dark",
  description: "Solarized dark (Ethan Schoonover) ported to a Modus palette.",
  mode: "dark",
  base: {
    "bg-main": "#002b36", // base03
    "fg-main": "#839496", // base0
    ...ACCENTS,
  },
  mappings: DARK_MAPPINGS,
};

export const solarizedLight: BaseScheme = {
  id: "solarized-light",
  label: "Solarized Light",
  description: "Solarized light (Ethan Schoonover) ported to a Modus palette.",
  mode: "light",
  base: {
    "bg-main": "#fdf6e3", // base3
    "fg-main": "#657b83", // base00
    ...ACCENTS,
  },
  mappings: LIGHT_MAPPINGS,
};
