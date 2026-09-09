// Build-time loader for the theme files.
//
// Two sources feed the catalogue, both pulled in eagerly by Vite's
// import.meta.glob:
//   - themes/resolved/*.json — written by scripts/resolve-themes.ts from the
//     pointer files (kind "source"); gitignored, so run `pnpm run resolve` first
//   - themes/{modus,ef,classic,community}/*.json of kind "full" or "partial" —
//     the in-repo files that predate pointers; a pointer file (kind "source")
//     found here is skipped, its resolved counterpart carries the theme
// A resolved file wins over an in-repo file with the same id.
//
// Every core palette (a full file with `coreSymbol`) is registered first so
// partials can fill their remainder from the right Modus core.
//
// Paths in the globs are relative to THIS file (src/theme/ -> ../../themes).

import {
  registerCore,
  toPreset,
  toThemeDoc,
  validateThemeFile,
  type Collection,
  type ResolvedThemeFile,
  type ThemeFile,
} from "./theme-file.ts";
import type { Preset, ThemeDoc } from "./types.ts";

const inRepo = import.meta.glob<ThemeFile>("../../themes/{modus,ef,classic,community}/*.json", {
  eager: true,
  import: "default",
});
const resolved = import.meta.glob<ThemeFile>("../../themes/resolved/*.json", {
  eager: true,
  import: "default",
});

interface LoadedFile {
  collection: Collection;
  file: ResolvedThemeFile;
}

function collectionOf(path: string, file: ResolvedThemeFile): Collection {
  if (file.collection) return file.collection;
  if (path.includes("/themes/modus/")) return "modus";
  if (path.includes("/themes/ef/")) return "ef";
  if (path.includes("/themes/classic/")) return "classic";
  return "community";
}

function stemOf(path: string): string {
  const base = path.slice(path.lastIndexOf("/") + 1);
  return base.replace(/\.json$/, "");
}

// An invalid file is skipped (with a console warning), never fatal: enforcement
// lives in the fs-based vitest suite (theme-files.test.ts), which fails a PR
// with per-file messages. Throwing here instead would crash every module that
// imports presets — including unrelated test suites — hiding the real error.
function parseAll(): Map<string, LoadedFile> {
  const out = new Map<string, LoadedFile>();
  const take = (entries: [string, ThemeFile][], override: boolean, kind: "full" | "partial") => {
    for (const [path, file] of entries) {
      if (file.kind !== kind) continue;
      const stem = stemOf(path);
      if (!override && out.has(stem)) continue;
      const issues = validateThemeFile(file, stem);
      const errors = issues.filter((i) => !i.message.startsWith("warning:"));
      if (errors.length > 0) {
        const lines = errors.map((i) => `  - ${i.message}`).join("\n");
        console.warn(`Skipping invalid theme file ${path}:\n${lines}`);
        continue;
      }
      out.set(stem, { collection: collectionOf(path, file), file });
    }
  };
  // Full files first: they carry the core palettes a partial expands from, and
  // validating a partial runs that expansion.
  take(Object.entries(inRepo), false, "full");
  take(Object.entries(resolved), true, "full");
  for (const { file } of out.values()) {
    if (file.kind === "full" && file.coreSymbol) registerCore(file.coreSymbol, toThemeDoc(file));
  }
  const core = (id: string, symbol: string) => {
    const hit = out.get(id);
    if (hit?.file.kind === "full") registerCore(symbol, toThemeDoc(hit.file));
  };
  core("modus-operandi", "modus-themes-operandi-palette");
  core("modus-vivendi", "modus-themes-vivendi-palette");
  take(Object.entries(inRepo), false, "partial");
  take(Object.entries(resolved), true, "partial");
  return out;
}

const LOADED = parseAll();

function requireFull(id: string): ThemeDoc {
  const hit = LOADED.get(id);
  if (!hit || hit.file.kind !== "full")
    throw new Error(`expected a full theme file with id "${id}"`);
  return toThemeDoc(hit.file);
}

// The two classic cores, kept as named exports for the tests and the exporter.
export const modusOperandi: ThemeDoc = requireFull("modus-operandi");
export const modusVivendi: ThemeDoc = requireFull("modus-vivendi");

// Collections in gallery/picker display order. ef splits into light/dark groups.
const COLLECTION_ORDER: readonly Collection[] = ["modus", "ef", "classic", "community"];

function sortByLabel(a: Preset, b: Preset): number {
  return a.label.localeCompare(b.label);
}

type CollectionBucket = Record<Collection, Preset[]>;

function bucketed(): CollectionBucket {
  const buckets: CollectionBucket = { modus: [], ef: [], classic: [], community: [] };
  for (const { collection, file } of LOADED.values()) {
    buckets[collection].push(toPreset(file));
  }
  return buckets;
}

const BUCKETS = bucketed();

export interface PresetGroup {
  label: string;
  presets: readonly Preset[];
}

function buildGroups(): PresetGroup[] {
  const groups: PresetGroup[] = [];
  const push = (label: string, presets: Preset[]) => {
    if (presets.length > 0) groups.push({ label, presets });
  };

  for (const collection of COLLECTION_ORDER) {
    if (collection === "ef") {
      const byMode = (mode: "light" | "dark") =>
        BUCKETS.ef.filter((p) => p.doc.meta.mode === mode).sort(sortByLabel);
      push("Ef — light", byMode("light"));
      push("Ef — dark", byMode("dark"));
      continue;
    }
    const label =
      collection === "modus" ? "Modus" : collection === "classic" ? "Classic" : "Community";
    // Modus keeps operandi-before-vivendi; others sort by label.
    const presets =
      collection === "modus"
        ? [...BUCKETS.modus].sort((a, b) =>
            a.id === "modus-operandi" ? -1 : b.id === "modus-operandi" ? 1 : 0,
          )
        : [...BUCKETS[collection]].sort(sortByLabel);
    push(label, presets);
  }
  return groups;
}

export const PRESET_GROUPS: readonly PresetGroup[] = buildGroups();

export const ALL_PRESETS: readonly Preset[] = PRESET_GROUPS.flatMap((g) => g.presets);
