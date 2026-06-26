import { describe, expect, it } from "vitest";

import { exportOverrides, exportThemeFile } from "./export-el.ts";
import { modusOperandi } from "./modus-operandi.ts";
import { cloneDoc } from "./presets.ts";

describe("exportThemeFile", () => {
  const el = exportThemeFile({
    ...modusOperandi,
    meta: { name: "my-theme", description: "My custom theme.", mode: "light" },
  });

  it("emits the modus-themes-theme call with correct arg order", () => {
    // The released modus-themes macro is (modus-themes-theme NAME PALETTE OVERRIDES).
    expect(el).toMatch(
      /\(modus-themes-theme my-theme\s+my-theme-palette\s+my-theme-palette-overrides\)/,
    );
    expect(el).toContain("(deftheme my-theme");
    expect(el).toContain(":background-mode 'light");
    expect(el).toContain("(eval-and-compile");
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

  it("provides the theme", () => {
    expect(el).toContain("(provide-theme 'my-theme)");
  });
});

describe("exportOverrides", () => {
  it("includes only entries that differ from the base", () => {
    const edited = cloneDoc(modusOperandi);
    edited.palette["magenta-cooler"] = "#123456";
    edited.mappings.keyword = "red";

    const snippet = exportOverrides(edited, modusOperandi, "modus-operandi");
    expect(snippet).toContain("(setq modus-operandi-palette-overrides");
    expect(snippet).toMatch(/\(magenta-cooler\s+"#123456"\)/);
    expect(snippet).toMatch(/\(keyword\s+red\)/);
    // An untouched entry must not appear.
    expect(snippet).not.toContain("bg-main");
  });

  it("reports no changes when identical to base", () => {
    const snippet = exportOverrides(cloneDoc(modusOperandi), modusOperandi, "modus-operandi");
    expect(snippet).toContain("No changes");
  });
});
