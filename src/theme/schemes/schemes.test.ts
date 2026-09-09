// Each classic-scheme partial theme file (themes/classic/*.json), when expanded
// through generatePalette, must yield a COMPLETE, resolvable Modus theme: bg/fg
// preserved, the full color set present, and every syntax role resolving to a
// scheme-flavored hex (not null, not a leftover Modus color).
//
// This exercises the SHIPPED JSON partials, not the old TS BaseScheme seeds, so
// the completeness guarantee is enforced on the files we actually load.

import { describe, expect, it } from "vitest";

import { isDark } from "../generate-palette.ts";
import { modusOperandi, modusVivendi } from "../loader.ts";
import { resolveValue } from "../resolve.ts";
import { registerModusCores, toThemeDoc, type PartialThemeFile } from "../theme-file.ts";
import type { ThemeDoc } from "../types.ts";
import nord from "../../../themes/classic/nord.json" with { type: "json" };
import solarizedDark from "../../../themes/classic/solarized-dark.json" with { type: "json" };
import solarizedLight from "../../../themes/classic/solarized-light.json" with { type: "json" };

registerModusCores(modusOperandi, modusVivendi);

const SCHEMES = [solarizedDark, solarizedLight, nord] as unknown as PartialThemeFile[];

function expand(scheme: PartialThemeFile): ThemeDoc {
  return toThemeDoc(scheme);
}

describe.each(SCHEMES)("scheme $id expands to a complete Modus theme", (scheme) => {
  const doc = expand(scheme);

  it("preserves the base colors verbatim", () => {
    for (const [key, hex] of Object.entries(scheme.base)) {
      expect(doc.palette[key as keyof typeof doc.palette]).toBe(hex);
    }
  });

  it("classifies the background mode consistently", () => {
    expect(isDark(doc.palette["bg-main"] as string)).toBe(scheme.meta.mode === "dark");
  });

  it("has no holes in the standard color set", () => {
    const must = [
      "bg-main",
      "fg-main",
      "bg-dim",
      "bg-active",
      "border",
      "fg-dim",
      "fg-alt",
      "red",
      "green",
      "yellow",
      "blue",
      "magenta",
      "cyan",
      "red-warmer",
      "blue-cooler",
      "cyan-faint",
      "magenta-intense",
      "bg-red-subtle",
      "bg-cyan-intense",
      "bg-yellow-nuanced",
    ];
    for (const key of must) {
      expect(doc.palette[key as keyof typeof doc.palette], `missing ${key}`).toBeDefined();
    }
  });

  it("resolves every core syntax role to a hex", () => {
    const roles = [
      "keyword",
      "string",
      "comment",
      "fnname",
      "type",
      "constant",
      "builtin",
      "variable",
    ] as const;
    for (const role of roles) {
      const hex = resolveValue(doc, doc.mappings[role] ?? role);
      expect(hex, `role ${role}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
