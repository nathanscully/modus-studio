import { describe, expect, it } from "vitest";

import { cloneSpec, getPreset } from "./presets.ts";
import { applyDiff, decodeFromParam, diffFromBase, encodeToParam } from "./serialize.ts";
import { expandSpec } from "./theme-file.ts";

const operandi = getPreset("modus-operandi")!.spec;
const efSummer = getPreset("ef-summer")!.spec;

describe("diff round-trip", () => {
  it("an unedited spec diffs to just the base id", () => {
    expect(diffFromBase(cloneSpec(operandi), "modus-operandi")).toEqual({
      base: "modus-operandi",
    });
  });

  it("applyDiff(diffFromBase(spec)) reconstructs the spec", () => {
    const edited = cloneSpec(operandi);
    edited.colors["magenta-cooler"] = "#123456";
    edited.mappings.keyword = "red";
    edited.meta.name = "my-theme";

    const rebuilt = applyDiff(diffFromBase(edited, "modus-operandi"));
    expect(rebuilt.colors["magenta-cooler"]).toBe("#123456");
    expect(rebuilt.mappings.keyword).toBe("red");
    expect(rebuilt.meta.name).toBe("my-theme");
    expect(rebuilt.colors["bg-main"]).toBe(operandi.colors["bg-main"]);
  });

  it("keeps a partial spec partial, with the edit as a pinned base color", () => {
    const edited = cloneSpec(efSummer);
    edited.colors["bg-dim"] = "#ffeeee";
    edited.mappings.comment = "red-faint";

    const diff = diffFromBase(edited, "ef-summer");
    expect(diff).toEqual({
      base: "ef-summer",
      palette: { "bg-dim": "#ffeeee" },
      mappings: { comment: "red-faint" },
    });
    const rebuilt = applyDiff(diff);
    expect(rebuilt.kind).toBe("partial");
    expect(rebuilt.core).toBe(efSummer.core);
    expect(expandSpec(rebuilt).palette["bg-dim"]).toBe("#ffeeee");
    expect(expandSpec(rebuilt).mappings.comment).toBe("red-faint");
  });
});

describe("URL param round-trip", () => {
  it("encode -> decode preserves edits", () => {
    const edited = cloneSpec(operandi);
    edited.colors["blue-warmer"] = "#abcdef";
    edited.mappings.string = "#fedcba";

    const param = encodeToParam(edited, "modus-operandi");
    const decoded = decodeFromParam(param);
    expect(decoded).not.toBeNull();
    expect(decoded!.baseId).toBe("modus-operandi");
    expect(decoded!.spec.colors["blue-warmer"]).toBe("#abcdef");
    expect(decoded!.spec.mappings.string).toBe("#fedcba");
  });

  it("decodes a link made before specs, whose diff used the same keys", () => {
    const legacy = btoa(
      JSON.stringify({ base: "ef-summer", palette: { "bg-main": "#fafafa" }, mappings: {} }),
    );
    const decoded = decodeFromParam(legacy);
    expect(decoded?.spec.colors["bg-main"]).toBe("#fafafa");
  });

  it("returns null for garbage input", () => {
    expect(decodeFromParam("!!!not-valid!!!")).toBeNull();
  });
});
