import { describe, expect, it } from "vitest";

import { modusOperandi } from "./modus-operandi.ts";
import { isHex, resolveAll, resolveRole, resolveValue, UNSPECIFIED } from "./resolve.ts";
import type { ThemeDoc } from "./types.ts";

const doc: ThemeDoc = {
  meta: { name: "t", description: "", mode: "light" },
  palette: { "fg-main": "#000000", "magenta-cooler": "#531ab6" },
  mappings: { keyword: "magenta-cooler", cursor: "fg-main", string: "#abcdef", err: UNSPECIFIED },
};

describe("isHex", () => {
  it("accepts 3/6/8-digit hex", () => {
    expect(isHex("#fff")).toBe(true);
    expect(isHex("#ffffff")).toBe(true);
    expect(isHex("#ffffffff")).toBe(true);
  });
  it("rejects non-hex", () => {
    expect(isHex("magenta")).toBe(false);
    expect(isHex("ffffff")).toBe(false);
  });
});

describe("resolveValue", () => {
  it("resolves a palette color name to its hex", () => {
    expect(resolveValue(doc, "magenta-cooler")).toBe("#531ab6");
  });
  it("returns a raw hex as-is", () => {
    expect(resolveValue(doc, "#abcdef")).toBe("#abcdef");
  });
  it("returns null for unspecified and unknown", () => {
    expect(resolveValue(doc, UNSPECIFIED)).toBeNull();
    expect(resolveValue(doc, "nonexistent-color")).toBeNull();
    expect(resolveValue(doc, undefined)).toBeNull();
  });
});

describe("resolveRole", () => {
  it("resolves a role through its mapping to a hex", () => {
    expect(resolveRole(doc, "keyword")).toBe("#531ab6");
    expect(resolveRole(doc, "cursor")).toBe("#000000");
    expect(resolveRole(doc, "string")).toBe("#abcdef");
  });
});

describe("resolveAll", () => {
  it("omits roles that resolve to null", () => {
    const all = resolveAll(doc);
    expect(all.keyword).toBe("#531ab6");
    expect("err" in all).toBe(false);
  });

  it("resolves the real operandi keyword to magenta-cooler's hex", () => {
    const all = resolveAll(modusOperandi);
    expect(all.keyword).toBe(modusOperandi.palette["magenta-cooler"]);
    expect(all.comment).toBe(modusOperandi.palette["fg-dim"]);
    // A color key like "bg-main" is not a role, so it never appears in resolveAll.
    expect(Object.keys(all)).not.toContain("bg-main");
  });
});
