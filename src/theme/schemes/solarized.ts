// Solarized (Ethan Schoonover) as Modus BASE-COLORS, light + dark.
//
// Solarized is a color scheme, not a Modus theme: it defines 16 values (an
// 8-step monotone ramp + 8 accents) and nothing else. We map its canonical
// roles onto the Modus base shape (bg-main, fg-main, + the six hues) and let
// `generatePalette` derive the full ~120-color palette. This mirrors the Modus
// manual's own Solarized walkthrough (doc/modus-themes.org §10.1.4), which uses
// exactly bg-main/fg-main + red/green/yellow/blue/magenta/cyan.
//
// Canonical hex values (https://github.com/altercation/solarized):
//   base03 #002b36  base02 #073642  base01 #586e75  base00 #657b83
//   base0  #839496  base1  #93a1a1  base2  #eee8d5  base3  #fdf6e3
//   yellow #b58900  orange #cb4b16  red    #dc322f  magenta #d33682
//   violet #6c71c4  blue   #268bd2  cyan   #2aa198  green   #859900
//
// Schoonover's design intent: in dark, bg = base03 and fg = base0; in light,
// bg = base3 and fg = base00 (the ramp is inverted, accents are shared). Modus's
// six-hue base has no violet/orange slot; the generator derives the -warmer/
// -cooler variants, so the six canonical hues are the faithful base (Prot uses
// magenta #d33682 for the magenta slot in his example).

import type { BaseScheme } from "../types.ts";

const ACCENTS = {
  red: "#dc322f",
  green: "#859900",
  yellow: "#b58900",
  blue: "#268bd2",
  magenta: "#d33682",
  cyan: "#2aa198",
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
};
