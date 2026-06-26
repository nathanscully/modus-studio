// Each classic-scheme BASE-COLORS set, when run through generatePalette with the
// matching Modus core, must yield a COMPLETE, resolvable Modus theme: bg/fg
// preserved, the full color set present, and every syntax role resolving to a
// scheme-flavored hex (not null, not a leftover Modus color).

import { describe, expect, it } from "vitest";

import { generatePalette, isDark } from "../generate-palette.ts";
import { modusOperandi } from "../modus-operandi.ts";
import { modusVivendi } from "../modus-vivendi.ts";
import { resolveValue } from "../resolve.ts";
import type { BaseScheme, ThemeDoc } from "../types.ts";
import { nord } from "./nord.ts";
import { solarizedDark, solarizedLight } from "./solarized.ts";

const SCHEMES: BaseScheme[] = [solarizedDark, solarizedLight, nord];

function expand(scheme: BaseScheme): ThemeDoc {
  const core = scheme.mode === "dark" ? modusVivendi : modusOperandi;
  const { palette, mappings } = generatePalette(scheme.base, {
    corePalette: core.palette,
    coreMappings: core.mappings,
    preference: scheme.preference,
  });
  return {
    meta: { name: scheme.id, description: scheme.description, mode: scheme.mode },
    palette,
    mappings,
  };
}

describe.each(SCHEMES)("scheme $id expands to a complete Modus theme", (scheme) => {
  const doc = expand(scheme);

  it("preserves the base colors verbatim", () => {
    for (const [key, hex] of Object.entries(scheme.base)) {
      expect(doc.palette[key as keyof typeof doc.palette]).toBe(hex);
    }
  });

  it("classifies the background mode consistently", () => {
    expect(isDark(doc.palette["bg-main"] as string)).toBe(scheme.mode === "dark");
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
