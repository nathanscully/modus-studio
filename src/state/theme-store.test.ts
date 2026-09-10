import { describe, expect, it } from "vitest";

import { cloneSpec, getPreset } from "~/theme/presets.ts";
import { specChanges } from "./theme-store.tsx";

describe("specChanges", () => {
  it("lists the keys that differ from the base preset, colors first", () => {
    const base = getPreset("ef-summer")!.spec;
    const spec = cloneSpec(base);
    spec.mappings.keyword = "red";
    spec.colors["bg-dim"] = "#ffffff";
    expect(specChanges(spec, base)).toEqual([
      { kind: "color", key: "bg-dim" },
      { kind: "mapping", key: "keyword" },
    ]);
  });

  it("is empty for an untouched spec", () => {
    const base = getPreset("modus-operandi")!.spec;
    expect(specChanges(cloneSpec(base), base)).toEqual([]);
  });
});
