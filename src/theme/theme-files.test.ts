// The PR gate for theme files. Every themes/**/*.json (pointers, in-repo
// full/partial files, and the resolved output) must pass validateThemeFile
// with zero errors (warnings are allowed). Failure messages name the file, the
// key, and what is wrong so a contributor can fix a submission without reading
// the loader. This suite mirrors the loader's rules (src/theme/loader.ts and
// theme-files-node.ts), so a file that passes here loads in the app.
//
// Run `pnpm run resolve` first: a pointer without a resolved counterpart fails.

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { validateThemeFile, type ThemeFileIssue } from "./theme-file.ts";
import { loadThemeFiles, readThemeFiles } from "./theme-files-node.ts";

const THEMES_DIR = resolve(import.meta.dirname, "../../themes");

const FILES = readThemeFiles(THEMES_DIR);
const IN_REPO = FILES.filter((f) => !f.path.includes("/resolved/"));
const LOADED = loadThemeFiles(THEMES_DIR);

function errorsOf(issues: ThemeFileIssue[]): ThemeFileIssue[] {
  return issues.filter((i) => !i.message.startsWith("warning:"));
}

function kindOf(parsed: unknown): string {
  return (parsed as { kind?: string }).kind ?? "?";
}

describe("theme files", () => {
  it("finds the expected built-in collections", () => {
    const counts = new Map<string, number>();
    for (const f of IN_REPO) counts.set(f.collection, (counts.get(f.collection) ?? 0) + 1);
    expect(counts.get("modus")).toBe(8);
    expect(counts.get("ef")).toBe(38);
    expect(counts.get("classic")).toBe(3);
  });

  it("every in-repo id is unique across collections", () => {
    const seen = new Map<string, string>();
    for (const f of IN_REPO) {
      const id = (f.parsed as { id?: unknown }).id;
      const key = typeof id === "string" ? id : f.stem;
      const prior = seen.get(key);
      expect(prior, `duplicate id "${key}" in ${f.path} and ${prior}`).toBeUndefined();
      seen.set(key, f.path);
    }
  });

  it("every pointer has been resolved", () => {
    const missing = IN_REPO.filter(
      (f) =>
        kindOf(f.parsed) === "source" &&
        !existsSync(join(THEMES_DIR, "resolved", `${f.stem}.json`)),
    ).map((f) => f.stem);
    expect(missing, "run `pnpm run resolve`").toEqual([]);
  });

  it("registers the eight Modus core palettes", () => {
    for (const variant of ["operandi", "operandi-tinted", "vivendi", "vivendi-tinted"]) {
      const hit = LOADED.get(`modus-${variant}`);
      expect(hit?.file.kind, variant).toBe("full");
      expect((hit?.file as { coreSymbol?: string }).coreSymbol).toBe(
        `modus-themes-${variant}-palette`,
      );
    }
  });

  describe.each(FILES)("$collection/$stem.json", (f) => {
    it("passes every validation rule", () => {
      const errors = errorsOf(validateThemeFile(f.parsed, f.stem));
      expect(errors, errors.map((i) => `${i.file}: ${i.message}`).join("\n")).toEqual([]);
    });
  });
});
