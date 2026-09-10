import { describe, expect, it } from "vitest";

import { validateThemeFile } from "~/theme/theme-file.ts";
import { buildPointer, parseRepo } from "./AddThemeDialog.tsx";

describe("parseRepo", () => {
  it("accepts owner/name, GitHub URLs and git remotes", () => {
    expect(parseRepo("paniash/modus-vague")).toBe("paniash/modus-vague");
    expect(parseRepo("https://github.com/paniash/modus-vague")).toBe("paniash/modus-vague");
    expect(parseRepo("https://github.com/paniash/modus-vague/tree/main")).toBe(
      "paniash/modus-vague",
    );
    expect(parseRepo("git@github.com:paniash/modus-vague.git")).toBe("paniash/modus-vague");
  });

  it("rejects anything that is not one repo", () => {
    expect(parseRepo("")).toBeNull();
    expect(parseRepo("modus-vague")).toBeNull();
    expect(parseRepo("https://gitlab.com/x/y")).toBeNull();
  });
});

describe("buildPointer", () => {
  it("drafts a valid kind:source pointer with an install snippet", () => {
    const pointer = buildPointer({
      id: "my-theme",
      repo: "me/my-theme",
      rev: "a".repeat(40),
      file: "my-theme-theme.el",
      theme: "my-theme",
      license: "GPL-3.0-or-later",
    });
    expect(validateThemeFile(pointer, "my-theme")).toEqual([]);
    expect(pointer.source.files).toEqual(["my-theme-theme.el"]);
    expect(pointer.install).toContain('(:url "https://github.com/me/my-theme")');
    expect(pointer.meta).toEqual({ license: "GPL-3.0-or-later" });
  });

  it("omits meta when no license is given", () => {
    const pointer = buildPointer({
      id: "t",
      repo: "me/t",
      rev: "b".repeat(40),
      file: "t-theme.el",
      theme: "t",
      license: "  ",
    });
    expect(pointer.meta).toBeUndefined();
  });
});
