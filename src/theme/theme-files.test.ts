// The PR gate for theme files. Every themes/**/*.json must pass validateThemeFile
// with zero errors (warnings are allowed). Failure messages name the file, the
// key, and what is wrong so a contributor can fix a submission without reading
// the loader. This suite mirrors the loader's validation exactly (both call
// validateThemeFile), so a file that passes here loads in the app.

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { modusOperandi, modusVivendi } from "./loader.ts";
import { registerModusCores, validateThemeFile, type ThemeFileIssue } from "./theme-file.ts";

registerModusCores(modusOperandi, modusVivendi);

const THEMES_DIR = resolve(fileURLToPath(import.meta.url), "../../../themes");

interface Found {
  path: string;
  stem: string;
  collection: string;
}

function findThemeFiles(): Found[] {
  const out: Found[] = [];
  for (const collection of readdirSync(THEMES_DIR, { withFileTypes: true })) {
    if (!collection.isDirectory()) continue;
    const dir = join(THEMES_DIR, collection.name);
    for (const entry of readdirSync(dir)) {
      if (!entry.endsWith(".json")) continue;
      out.push({
        path: join(dir, entry),
        stem: entry.replace(/\.json$/, ""),
        collection: collection.name,
      });
    }
  }
  return out;
}

const FILES = findThemeFiles();

function errorsOf(issues: ThemeFileIssue[]): ThemeFileIssue[] {
  return issues.filter((i) => !i.message.startsWith("warning:"));
}

describe("theme files", () => {
  it("finds the expected built-in collections", () => {
    const counts = new Map<string, number>();
    for (const f of FILES) counts.set(f.collection, (counts.get(f.collection) ?? 0) + 1);
    expect(counts.get("modus")).toBe(2);
    expect(counts.get("ef")).toBe(38);
    expect(counts.get("classic")).toBe(3);
  });

  it("every id is unique across all collections", () => {
    const seen = new Map<string, string>();
    for (const f of FILES) {
      const parsed = JSON.parse(readFileSync(f.path, "utf8")) as { id?: unknown };
      const id = typeof parsed.id === "string" ? parsed.id : f.stem;
      const prior = seen.get(id);
      expect(prior, `duplicate id "${id}" in ${f.path} and ${prior}`).toBeUndefined();
      seen.set(id, f.path);
    }
  });

  describe.each(FILES)("$collection/$stem.json", (f) => {
    const parsed = JSON.parse(readFileSync(f.path, "utf8")) as unknown;

    it("passes every validation rule", () => {
      const issues = validateThemeFile(parsed, f.stem);
      const errors = errorsOf(issues);
      expect(errors, errors.map((i) => `${i.file}: ${i.message}`).join("\n")).toEqual([]);
    });
  });
});
