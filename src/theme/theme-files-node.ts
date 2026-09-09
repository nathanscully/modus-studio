// Node-side reading of the theme files on disk, for scripts and the fs-based
// test suite. Mirrors the loader's rules (src/theme/loader.ts): pointer files
// are skipped, resolved files win over in-repo files with the same id, and
// core palettes are registered before any partial is expanded.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  registerCore,
  toThemeDoc,
  validateThemeFile,
  type Collection,
  type ResolvedThemeFile,
  type ThemeFile,
} from "./theme-file.ts";

export const COLLECTION_DIRS: readonly Collection[] = ["modus", "ef", "classic", "community"];

export interface DiskThemeFile {
  path: string;
  stem: string;
  collection: Collection;
  parsed: unknown;
}

/** Every JSON file under the collection directories and themes/resolved, unvalidated. */
export function readThemeFiles(themesDir: string): DiskThemeFile[] {
  const out: DiskThemeFile[] = [];
  for (const dir of [...COLLECTION_DIRS, "resolved"]) {
    const full = join(themesDir, dir);
    if (!existsSync(full)) continue;
    for (const name of readdirSync(full).sort()) {
      if (!name.endsWith(".json")) continue;
      const path = join(full, name);
      const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
      const collection =
        dir === "resolved"
          ? ((parsed as { collection?: Collection }).collection ?? "community")
          : (dir as Collection);
      out.push({ path, stem: name.replace(/\.json$/, ""), collection, parsed });
    }
  }
  return out;
}

export interface LoadedThemeFile {
  path: string;
  collection: Collection;
  file: ResolvedThemeFile;
}

/**
 * Validate and load the resolvable theme files, registering core palettes.
 * Throws on the first invalid file with its issues listed.
 */
export function loadThemeFiles(themesDir: string): Map<string, LoadedThemeFile> {
  const out = new Map<string, LoadedThemeFile>();
  const validate = (entry: DiskThemeFile) => {
    const issues = validateThemeFile(entry.parsed, entry.stem).filter(
      (i) => !i.message.startsWith("warning:"),
    );
    if (issues.length > 0) {
      throw new Error(
        `invalid theme file ${entry.path}:\n${issues.map((i) => `  - ${i.message}`).join("\n")}`,
      );
    }
    const file = entry.parsed as ThemeFile as ResolvedThemeFile;
    const resolved = entry.path.includes("/resolved/");
    if (!resolved && out.has(entry.stem)) return;
    out.set(entry.stem, { path: entry.path, collection: entry.collection, file });
  };

  // Full files first: they carry the core palettes a partial expands from, and
  // validating a partial runs that expansion.
  const entries = readThemeFiles(themesDir).filter(
    (e) => (e.parsed as { kind?: string }).kind !== "source",
  );
  const kindOf = (e: DiskThemeFile) => (e.parsed as { kind?: string }).kind;
  for (const entry of entries) if (kindOf(entry) === "full") validate(entry);
  for (const { file } of out.values()) {
    if (file.kind === "full" && file.coreSymbol) registerCore(file.coreSymbol, toThemeDoc(file));
  }
  const core = (id: string, symbol: string) => {
    const hit = out.get(id);
    if (hit?.file.kind === "full") registerCore(symbol, toThemeDoc(hit.file));
  };
  core("modus-operandi", "modus-themes-operandi-palette");
  core("modus-vivendi", "modus-themes-vivendi-palette");
  for (const entry of entries) if (kindOf(entry) !== "full") validate(entry);
  return out;
}
