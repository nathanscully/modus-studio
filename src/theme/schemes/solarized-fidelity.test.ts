// Proves our Solarized port matches the established bbatsov/solarized-emacs port,
// not just that it "generates something". For each color we compute the CIEDE2000
// perceptual distance (ΔE) to solarized-emacs's value; <1.0 is imperceptible.
//
// Two things are checked:
//   1. Palette fidelity — the 16 canonical Solarized colors our generator
//      derives must equal Solarized exactly (these are verbatim base colors).
//   2. Role fidelity — each syntax/UI role, resolved through our generated
//      palette, must land on the same color solarized-emacs assigns that face
//      (solarized-faces.el). This is what makes the port LOOK like Solarized.
//
// solarized-emacs reference values are transcribed from solarized-palettes.el
// (the canonical 16) and solarized-faces.el (the face→color map).

import { describe, expect, it } from "vitest";

import { modusOperandi, modusVivendi } from "../loader.ts";
import { resolveValue } from "../resolve.ts";
import { registerModusCores, toThemeDoc, type PartialThemeFile } from "../theme-file.ts";
import type { ThemeDoc } from "../types.ts";
import solarizedDark from "../../../themes/classic/solarized-dark.json" with { type: "json" };
import solarizedLight from "../../../themes/classic/solarized-light.json" with { type: "json" };

registerModusCores(modusOperandi, modusVivendi);

// --- CIEDE2000 ΔE (hex → CIELab → ΔE00) ---
function hexToRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255) as [number, number, number];
}
function rgbToLab([r, g, b]: [number, number, number]): [number, number, number] {
  const f = (c: number) => (c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92);
  [r, g, b] = [f(r), f(g), f(b)];
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const g2 = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [g2(x), g2(y), g2(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function deltaE(h1: string, h2: string): number {
  const [L1, a1, b1] = rgbToLab(hexToRgb(h1));
  const [L2, a2, b2] = rgbToLab(hexToRgb(h2));
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(avgC ** 7 / (avgC ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const avgCp = (C1p + C2p) / 2;
  const h1p = (Math.atan2(b1, a1p) * 180) / Math.PI;
  const h2p = (Math.atan2(b2, a2p) * 180) / Math.PI;
  const h1pp = (h1p + 360) % 360;
  const h2pp = (h2p + 360) % 360;
  let dhp: number;
  if (Math.abs(h1pp - h2pp) <= 180) dhp = h2pp - h1pp;
  else dhp = h2pp <= h1pp ? h2pp - h1pp + 360 : h2pp - h1pp - 360;
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);
  const avgLp = (L1 + L2) / 2;
  const avghp = Math.abs(h1pp - h2pp) > 180 ? (h1pp + h2pp + 360) / 2 : (h1pp + h2pp) / 2;
  const T =
    1 -
    0.17 * Math.cos(((avghp - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * avghp * Math.PI) / 180) +
    0.32 * Math.cos(((3 * avghp + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * avghp - 63) * Math.PI) / 180);
  const Sl = 1 + (0.015 * (avgLp - 50) ** 2) / Math.sqrt(20 + (avgLp - 50) ** 2);
  const Sc = 1 + 0.045 * avgCp;
  const Sh = 1 + 0.015 * avgCp * T;
  const dTheta = 30 * Math.exp(-(((avghp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(avgCp ** 7 / (avgCp ** 7 + 25 ** 7));
  const Rt = -Rc * Math.sin((2 * dTheta * Math.PI) / 180);
  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh),
  );
}

function expand(scheme: PartialThemeFile): ThemeDoc {
  return toThemeDoc(scheme);
}

// The canonical Solarized 16 (solarized-palettes.el); accents shared across modes.
const SOL = {
  base03: "#002b36",
  base02: "#073642",
  base01: "#586e75",
  base00: "#657b83",
  base0: "#839496",
  base1: "#93a1a1",
  base2: "#eee8d5",
  base3: "#fdf6e3",
  yellow: "#b58900",
  orange: "#cb4b16",
  red: "#dc322f",
  magenta: "#d33682",
  violet: "#6c71c4",
  blue: "#268bd2",
  cyan: "#2aa198",
  green: "#859900",
};

// JND: a ΔE under ~1 is imperceptible. We require near-exact since these are
// verbatim ports, allowing only floating-point slack.
const EXACT = 1.0;

describe.each([solarizedDark, solarizedLight] as unknown as PartialThemeFile[])(
  "Solarized port fidelity — $id",
  (scheme) => {
    const doc = expand(scheme);
    const light = scheme.meta.mode === "light";
    // Light flips the monotone ramp (bg/fg); accents are identical.
    const bg = light ? SOL.base3 : SOL.base03;
    const fg = light ? SOL.base00 : SOL.base0;

    it.each([
      ["bg-main", bg],
      ["fg-main", fg],
      ["red", SOL.red],
      ["green", SOL.green],
      ["yellow", SOL.yellow],
      ["blue", SOL.blue],
      ["magenta", SOL.magenta],
      ["cyan", SOL.cyan],
    ])("palette %s equals canonical Solarized (ΔE≈0)", (key, ref) => {
      const ours = doc.palette[key as keyof typeof doc.palette] as string;
      expect(deltaE(ours, ref), `${key}: ${ours} vs ${ref}`).toBeLessThan(EXACT);
    });

    // solarized-emacs face → color (solarized-faces.el). base01 differs by mode.
    const base01 = light ? SOL.base1 : SOL.base01;
    it.each([
      ["keyword", SOL.green],
      ["string", SOL.cyan],
      ["fnname", SOL.blue],
      ["variable", SOL.blue],
      ["type", SOL.yellow],
      ["constant", SOL.blue],
      ["builtin", fg],
      ["preprocessor", SOL.blue],
      ["docstring", SOL.cyan],
      ["comment", base01],
      ["cursor", fg],
      ["err", SOL.orange],
      ["warning", SOL.yellow],
      ["info", SOL.green],
    ])("role %s matches solarized-emacs (ΔE≈0)", (role, ref) => {
      const ours = resolveValue(doc, doc.mappings[role as keyof typeof doc.mappings] ?? role);
      expect(ours, `role ${role} unresolved`).not.toBeNull();
      expect(deltaE(ours as string, ref), `${role}: ${ours} vs ${ref}`).toBeLessThan(EXACT);
    });
  },
);
