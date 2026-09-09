// Build-time loader for the on-disk theme files (themes/**/*.json).
//
// Vite's import.meta.glob pulls every theme JSON in eagerly at build time. Each
// file is validated with the same logic the vitest suite uses (theme-file.ts),
// then turned into a Preset: "full" docs pass through, "partial" schemes are
// expanded through the verified generatePalette. The modus cores (themselves
// full files) are registered first so partials can fill their remainder from the
// right Modus base.
//
// The path in the glob is relative to THIS file (src/theme/ -> ../../themes).
// themes/ stays a top-level directory; only the glob reaches up into it.

import {
  registerModusCores,
  toPreset,
  toThemeDoc,
  validateThemeFile,
  type Collection,
  type ThemeFile,
} from "./theme-file.ts";
import type { Preset, ThemeDoc } from "./types.ts";

const modules = import.meta.glob<ThemeFile>("../../themes/**/*.json", {
  eager: true,
  import: "default",
});

interface LoadedFile {
  collection: Collection;
  stem: string;
  file: ThemeFile;
}

function collectionOf(path: string): Collection {
  if (path.includes("/themes/modus/")) return "modus";
  if (path.includes("/themes/ef/")) return "ef";
  if (path.includes("/themes/classic/")) return "classic";
  return "community";
}

function stemOf(path: string): string {
  const base = path.slice(path.lastIndexOf("/") + 1);
  return base.replace(/\.json$/, "");
}

const ENTRIES: readonly (readonly [string, ThemeFile])[] = Object.entries(modules);

function findFull(id: string): ThemeDoc {
  const hit = ENTRIES.find(([, file]) => file.id === id && file.kind === "full");
  if (!hit) throw new Error(`expected a full theme file with id "${id}"`);
  return toThemeDoc(hit[1]);
}

// The modus cores (themselves full files) must be registered before any partial
// is validated or expanded, since expansion fills from the matching Modus base.
export const modusOperandi: ThemeDoc = findFull("modus-operandi");
export const modusVivendi: ThemeDoc = findFull("modus-vivendi");
registerModusCores(modusOperandi, modusVivendi);

// An invalid file is skipped (with a console warning), never fatal: enforcement
// lives in the fs-based vitest suite (theme-files.test.ts), which fails a PR
// with per-file messages. Throwing here instead would crash every module that
// imports presets — including unrelated test suites — hiding the real error.
function parseAll(): LoadedFile[] {
  const out: LoadedFile[] = [];
  for (const [path, file] of ENTRIES) {
    const stem = stemOf(path);
    const issues = validateThemeFile(file, stem);
    const errors = issues.filter((i) => !i.message.startsWith("warning:"));
    if (errors.length > 0) {
      const lines = errors.map((i) => `  - ${i.message}`).join("\n");
      console.warn(`Skipping invalid theme file ${path}:\n${lines}`);
      continue;
    }
    out.push({ collection: collectionOf(path), stem, file });
  }
  return out;
}

const LOADED = parseAll();

// Collections in gallery/picker display order. ef splits into light/dark groups.
const COLLECTION_ORDER: readonly Collection[] = ["modus", "ef", "classic", "community"];

function sortByLabel(a: Preset, b: Preset): number {
  return a.label.localeCompare(b.label);
}

interface CollectionBucket {
  modus: Preset[];
  ef: Preset[];
  classic: Preset[];
  community: Preset[];
}

function bucketed(): CollectionBucket {
  const buckets: CollectionBucket = { modus: [], ef: [], classic: [], community: [] };
  for (const { collection, file } of LOADED) {
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
