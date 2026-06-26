import { describe, expect, it } from "vitest";

import { modusOperandi } from "./modus-operandi.ts";
import { cloneDoc } from "./presets.ts";
import { applyDiff, decodeFromParam, diffFromBase, encodeToParam } from "./serialize.ts";

describe("diff round-trip", () => {
  it("an unedited doc diffs to just the base id", () => {
    const diff = diffFromBase(cloneDoc(modusOperandi), "modus-operandi");
    expect(diff).toEqual({ base: "modus-operandi" });
  });

  it("applyDiff(diffFromBase(doc)) reconstructs the doc", () => {
    const edited = cloneDoc(modusOperandi);
    edited.palette["magenta-cooler"] = "#123456";
    edited.mappings.keyword = "red";
    edited.meta.name = "my-theme";

    const rebuilt = applyDiff(diffFromBase(edited, "modus-operandi"));
    expect(rebuilt.palette["magenta-cooler"]).toBe("#123456");
    expect(rebuilt.mappings.keyword).toBe("red");
    expect(rebuilt.meta.name).toBe("my-theme");
    // Untouched values still match the base.
    expect(rebuilt.palette["bg-main"]).toBe(modusOperandi.palette["bg-main"]);
  });
});

describe("URL param round-trip", () => {
  it("encode -> decode preserves edits", () => {
    const edited = cloneDoc(modusOperandi);
    edited.palette["blue-warmer"] = "#abcdef";
    edited.mappings.string = "#fedcba";

    const param = encodeToParam(edited, "modus-operandi");
    const decoded = decodeFromParam(param);
    expect(decoded).not.toBeNull();
    expect(decoded!.baseId).toBe("modus-operandi");
    expect(decoded!.doc.palette["blue-warmer"]).toBe("#abcdef");
    expect(decoded!.doc.mappings.string).toBe("#fedcba");
  });

  it("returns null for garbage input", () => {
    expect(decodeFromParam("!!!not-valid!!!")).toBeNull();
  });
});
