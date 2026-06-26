// Validates the TypeScript port of `modus-themes-generate-palette` against the
// REAL output of that function in Emacs. Fixtures:
//   ef-summer-base.json       — ef-summer's 70-color BASE-COLORS (the input)
//   ef-summer-generated.json  — the 113 named colors Emacs derived from it
//                               (captured via `emacs --batch` running the actual
//                                modus-themes-generate-palette; see commit notes)
//
// We feed the same base into our port and assert every base-or-derived color
// matches Emacs to the digit. The handful of colors that come purely from the
// CORE-PALETTE fill (operandi-tinted for this warm light theme) are excluded:
// we fill from plain operandi here, and the core choice is the caller's, not a
// property of the derivation math. The math itself is exercised by the ~40
// derived entries (bg-dim, border, fg-alt, the per-hue warmer/cooler/faint/
// intense, and bg-<hue>-subtle/intense/nuanced).

import { describe, expect, it } from "vitest";

import efSummerBase from "./__fixtures__/ef-summer-base.json" with { type: "json" };
import efSummerGenerated from "./__fixtures__/ef-summer-generated.json" with { type: "json" };
import { generatePalette, isDark } from "./generate-palette.ts";
import { modusOperandi } from "./modus-operandi.ts";
import type { Palette } from "./types.ts";

const base = efSummerBase as Palette;
const emacs = efSummerGenerated as Record<string, string>;

// Colors that come only from the CORE-PALETTE fill differ between operandi and
// operandi-tinted; exclude them from the math comparison (we fill from operandi).
const CORE_ONLY = new Set(["olive", "bg-changed-fringe", "bg-diff-context"]);

describe("generatePalette — color.el primitives", () => {
  it("classifies light/dark backgrounds via WCAG contrast", () => {
    expect(isDark("#fff2f3")).toBe(false); // ef-summer bg-main (light)
    expect(isDark("#0f0b15")).toBe(true); // ef-winter bg-main (dark)
    expect(isDark("#ffffff")).toBe(false);
    expect(isDark("#000000")).toBe(true);
  });
});

describe("generatePalette — matches real Emacs output (ef-summer 70→113)", () => {
  const { palette } = generatePalette(base, { corePalette: modusOperandi.palette });

  it("produces every named color Emacs did", () => {
    for (const key of Object.keys(emacs)) {
      expect(palette[key as keyof Palette], `missing ${key}`).toBeDefined();
    }
  });

  // Spot-check the documented known-good derived values (architecture doc §3).
  it.each([
    ["red-intense", "#d63a44"],
    ["green-intense", "#22803f"],
    ["magenta-intense", "#c437b8"],
  ])("derives %s = %s (verified against Emacs)", (key, hex) => {
    expect(palette[key as keyof Palette]).toBe(hex);
  });

  // The exhaustive check: every base-or-derived color equals Emacs exactly.
  const comparable = Object.keys(emacs).filter((k) => !CORE_ONLY.has(k));
  it.each(comparable)("%s matches Emacs to the digit", (key) => {
    expect(palette[key as keyof Palette], key).toBe(emacs[key]);
  });
});
