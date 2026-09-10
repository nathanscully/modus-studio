import { describe, expect, it } from "vitest";

import { exportOverrides, exportThemeFile } from "./export-el.ts";
import { cloneSpec, getPreset } from "./presets.ts";
import type { ThemeSpec } from "./types.ts";

const operandi = getPreset("modus-operandi")!.spec;
const nord = getPreset("nord")!.spec;

describe("exportThemeFile for a full spec", () => {
  const el = exportThemeFile({
    ...operandi,
    meta: {
      name: "my-theme",
      description: 'My "custom" theme.',
      mode: "light",
      author: "Ada Lovelace",
      homepage: "https://example.org/my-theme",
      license: "GPL-3.0-or-later",
    },
  });

  it("branches on the modus-themes-theme API at load time", () => {
    expect(el).toContain("(if (macrop 'modus-themes-theme)");
    expect(el).toContain("(eval-and-compile");
  });

  it("emits the modus-themes 4 macro form with bare symbols", () => {
    // Bundled with Emacs 30: (modus-themes-theme NAME PALETTE OVERRIDES).
    expect(el).toMatch(
      /\(modus-themes-theme my-theme\s+my-theme-palette\s+my-theme-palette-overrides\)/,
    );
    expect(el).toContain("(deftheme my-theme");
    expect(el).toContain(":background-mode 'light");
    expect(el).toContain("(provide-theme 'my-theme)");
  });

  it("emits the modus-themes 5 function form with quoted symbols", () => {
    // Bundled with Emacs 31 and on GNU ELPA:
    // (modus-themes-theme NAME FAMILY DESCRIPTION MODE CORE USER OVERRIDES).
    expect(el).toMatch(
      /\(modus-themes-theme\s+'my-theme\s+'my-theme\s+"My \\"custom\\" theme\."\s+'light\s+'my-theme-palette\s+'my-theme-palette-user\s+'my-theme-palette-overrides\)/,
    );
    expect(el).toContain("(defcustom my-theme-palette-user nil");
  });

  it("requires modus-themes from ELPA first, then the bundled copy", () => {
    expect(el).toMatch(
      /\(unless \(require 'modus-themes nil t\)\s+\(require-theme 'modus-themes\)\)/,
    );
  });

  it("credits the author in the header", () => {
    expect(el).toContain(";; Author: Ada Lovelace");
    expect(el).toContain(";; URL: https://example.org/my-theme");
    expect(el).toContain(";; SPDX-License-Identifier: GPL-3.0-or-later");
    expect(el).toContain("Made with modus-studio");
  });

  it("omits credit lines the spec does not have", () => {
    const bare = exportThemeFile({
      ...operandi,
      meta: { name: "bare", description: "Bare.", mode: "light" },
    });
    expect(bare).not.toContain(";; Author:");
    expect(bare).not.toContain(";; URL:");
    expect(bare).not.toContain("SPDX-License-Identifier");
  });

  it("defines a palette defconst with both layers", () => {
    expect(el).toContain("(defconst my-theme-palette");
    expect(el).toContain("(bg-main"); // a layer-1 hex entry
    expect(el).toContain("(keyword"); // a layer-2 mapping entry
    expect(el).toContain(";;;; Semantic mappings");
  });

  it("emits hex as quoted strings and color names as bare symbols", () => {
    expect(el).toMatch(/\(bg-main\s+"#ffffff"\)/);
    expect(el).toMatch(/\(keyword\s+magenta-cooler\)/); // symbol, unquoted
  });
});

describe("exportThemeFile for a partial spec", () => {
  const spec: ThemeSpec = {
    ...cloneSpec(nord),
    meta: { ...nord.meta, name: "my-nord", author: "Ada Lovelace" },
  };
  spec.mappings.keyword = "green";
  spec.mappings.string = "#fedcba";
  const el = exportThemeFile(spec);

  it("writes the author's base colors and one generate-palette call", () => {
    expect(el).toContain("(defconst my-nord-palette-base");
    expect(el).toMatch(/\(bg-main\s+"#2e3440"\)/);
    expect(el).toMatch(
      /\(defconst my-nord-palette\s+\(modus-themes-generate-palette\s+my-nord-palette-base\s+'cool\s+modus-themes-vivendi-palette\s+my-nord-palette-mappings\)/,
    );
    expect(el).not.toContain(";;;; Semantic mappings");
    expect(el).not.toContain("(macrop 'modus-themes-theme)");
  });

  it("keeps symbol mappings in MAPPINGS and moves a hex mapping into the base colors", () => {
    expect(el).toMatch(/\(defconst my-nord-palette-mappings\s+'\(\s+\(keyword\s+green\)/);
    const hexEntry = el.search(/\(string\s+"#fedcba"\)/);
    expect(hexEntry).toBeGreaterThan(el.indexOf("(defconst my-nord-palette-base"));
    expect(hexEntry).toBeLessThan(el.indexOf("(defconst my-nord-palette-mappings"));
  });

  it("declares the modus-themes 5 dependency and guards the function", () => {
    expect(el).toContain(';; Package-Requires: ((emacs "28.1") (modus-themes "5.0.0"))');
    expect(el).toContain("(unless (fboundp 'modus-themes-generate-palette)");
    expect(el).toMatch(/\(modus-themes-theme\s+'my-nord\s+'my-nord\s+"[^"]*"\s+'dark/);
  });

  it("passes nil for MAPPINGS when the spec has none", () => {
    const plain = exportThemeFile({ ...cloneSpec(nord), mappings: {} });
    expect(plain).toMatch(/modus-themes-vivendi-palette\s+nil\)/);
    expect(plain).not.toContain("palette-mappings");
  });
});

describe("exportOverrides", () => {
  it("includes only entries that differ from the base", () => {
    const edited = cloneSpec(operandi);
    edited.colors["magenta-cooler"] = "#123456";
    edited.mappings.keyword = "red";

    const snippet = exportOverrides(edited, operandi, "modus-operandi");
    expect(snippet).toContain("(setq modus-operandi-palette-overrides");
    expect(snippet).toMatch(/\(magenta-cooler\s+"#123456"\)/);
    expect(snippet).toMatch(/\(keyword\s+red\)/);
    expect(snippet).not.toContain("bg-main");
  });

  it("reports no changes when identical to base", () => {
    const snippet = exportOverrides(cloneSpec(operandi), operandi, "modus-operandi");
    expect(snippet).toContain("No changes");
  });
});
