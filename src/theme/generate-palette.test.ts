// Fidelity of the TypeScript port of `modus-themes-generate-palette` against
// real Emacs. The fixture ef-summer-generated.json is the NAMED-COLOR half of
// `(modus-themes-generate-palette ef-summer-palette-partial)` evaluated in
// Emacs 31.1 with the pinned upstream modus-themes.el (see
// src/theme/elisp/__fixtures__), so it exercises both the derivation math
// (Emacs 31's color-lighten-hsl) and the default-core rule (a warm light
// background fills from modus-themes-operandi-tinted-palette).

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import efSummerBase from "./__fixtures__/ef-summer-base.json" with { type: "json" };
import efSummerGenerated from "./__fixtures__/ef-summer-generated.json" with { type: "json" };
import { alistToMapping, alistToPalette, evaluatePalettes } from "./elisp/extract.ts";
import { generatePalette, isDark, isWarm } from "./generate-palette.ts";
import type { Palette } from "./types.ts";

const base = efSummerBase as Palette;
const emacs = efSummerGenerated as Record<string, string>;

const MODUS_EL = join(
  import.meta.dirname,
  "elisp/__fixtures__/protesilaos__modus-themes@f1ad6c9/modus-themes.el",
);
const cores = evaluatePalettes(
  [{ path: "modus-themes.el", text: readFileSync(MODUS_EL, "utf8") }],
  ["modus-themes-operandi-tinted-palette"],
);
const tinted = cores.get("modus-themes-operandi-tinted-palette")!;

describe("generatePalette — color.el primitives", () => {
  it("classifies light/dark backgrounds via WCAG contrast", () => {
    expect(isDark("#fff2f3")).toBe(false);
    expect(isDark("#0f0b15")).toBe(true);
    expect(isDark("#ffffff")).toBe(false);
    expect(isDark("#000000")).toBe(true);
  });

  it("calls a background warm when red exceeds blue", () => {
    expect(isWarm("#fff2f3")).toBe(true);
    expect(isWarm("#f0f4ff")).toBe(false);
  });
});

describe("generatePalette — matches Emacs 31 output for ef-summer", () => {
  const { palette, mappings } = generatePalette(base, {
    corePalette: alistToPalette(tinted),
    coreMappings: alistToMapping(tinted),
  });

  it("produces exactly the named colors Emacs did", () => {
    expect(Object.keys(palette).sort()).toEqual(Object.keys(emacs).sort());
  });

  it.each(Object.keys(emacs))("%s matches Emacs to the digit", (key) => {
    expect(palette[key as keyof Palette], key).toBe(emacs[key]);
  });

  it("turns core named colors into mappings where the engine derives a mapping", () => {
    const asMapping = mappings as Record<string, string>;
    expect(palette.rust).toBeUndefined();
    expect(asMapping.rust).toBe("red-faint");
    expect(asMapping["bg-graph-red-0"]).toBe("bg-red-subtle");
  });
});
