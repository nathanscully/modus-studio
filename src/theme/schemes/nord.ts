// Nord (arctic, north-bluish) as Modus BASE-COLORS.
//
// Nord is a 16-color scheme grouped into Polar Night (dark base), Snow Storm
// (light fg), Frost (bluish primaries) and Aurora (colorful accents). We map it
// onto the Modus base shape and let `generatePalette` derive the rest. Nord is a
// single dark theme upstream.
//
// Canonical hex values (https://www.nordtheme.com/docs/colors-and-palettes):
//   Polar Night: nord0 #2e3440  nord1 #3b4252  nord2 #434c5e  nord3 #4c566a
//   Snow Storm:  nord4 #d8dee9  nord5 #e5e9f0  nord6 #eceff4
//   Frost:       nord7 #8fbcbb  nord8 #88c0d0  nord9 #81a1c1  nord10 #5e81ac
//   Aurora:      nord11 #bf616a (red)  nord12 #d08770 (orange)  nord13 #ebcb8b
//                (yellow)  nord14 #a3be8c (green)  nord15 #b48ead (purple)
//
// Mapping: bg-main = nord0, fg-main = nord4. The six Modus hues come from Aurora
// (red/yellow/green/magenta) plus Frost (blue = nord10, cyan = nord8), matching
// Nord's documented syntax roles. Nord reads cool, so we hint the generator to
// bias derived hues cool.

import type { BaseScheme } from "../types.ts";

export const nord: BaseScheme = {
  id: "nord",
  label: "Nord",
  description: "Nord (arctic, north-bluish) ported to a Modus palette.",
  mode: "dark",
  preference: "cool",
  base: {
    "bg-main": "#2e3440", // nord0
    "fg-main": "#d8dee9", // nord4
    red: "#bf616a", // nord11
    green: "#a3be8c", // nord14
    yellow: "#ebcb8b", // nord13
    blue: "#5e81ac", // nord10
    magenta: "#b48ead", // nord15
    cyan: "#88c0d0", // nord8
  },
};
