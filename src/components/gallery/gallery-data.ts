// Flattened, filterable view of the bundled presets for the gallery grid.
//
// PRESET_GROUPS already carries the collection split the picker uses (Modus /
// Ef — light / Ef — dark / Classic / Community). The gallery reuses those group
// labels verbatim as its collection facets, and flattens each preset into a
// lightweight entry carrying everything a card needs: label, mode, author, the
// eight swatch hexes, and the resolved syntax colors for the mini snippet.

import { PRESET_GROUPS } from "~/theme/presets.ts";
import { HUES } from "~/theme/palette-keys.ts";
import { resolveAll } from "~/theme/resolve.ts";
import type { RoleKey } from "~/theme/palette-keys.ts";
import type { Preset, ThemeMode } from "~/theme/types.ts";

export type ModeFilter = "all" | ThemeMode;

export interface GalleryEntry {
  id: string;
  label: string;
  collection: string;
  mode: ThemeMode;
  author?: string;
  description: string;
  tags: readonly string[];
  /** bg-main, fg-main, then the six hues — the card swatch strip. */
  swatches: readonly string[];
  bgMain: string;
  fgMain: string;
  border: string;
  /** Resolved hex per syntax role, for painting the static snippet. */
  roleColors: Partial<Record<RoleKey, string>>;
}

export const COLLECTIONS: readonly string[] = PRESET_GROUPS.map((g) => g.label);

function toEntry(collection: string, preset: Preset): GalleryEntry {
  const { doc } = preset;
  const p = doc.palette;
  const roleColors = resolveAll(doc);
  const bgMain = p["bg-main"] ?? "#ffffff";
  const fgMain = p["fg-main"] ?? "#000000";
  return {
    id: preset.id,
    label: preset.label,
    collection,
    mode: doc.meta.mode,
    author: doc.meta.author,
    description: doc.meta.description,
    tags: doc.meta.tags ?? [],
    swatches: [bgMain, fgMain, ...HUES.map((h) => p[h] ?? fgMain)],
    bgMain,
    fgMain,
    border: p.border ?? fgMain,
    roleColors,
  };
}

export const GALLERY_ENTRIES: readonly GalleryEntry[] = PRESET_GROUPS.flatMap((group) =>
  group.presets.map((preset) => toEntry(group.label, preset)),
);

export function filterEntries(
  entries: readonly GalleryEntry[],
  query: string,
  mode: ModeFilter,
  collection: string | null,
): GalleryEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((e) => {
    if (mode !== "all" && e.mode !== mode) return false;
    if (collection && e.collection !== collection) return false;
    if (!q) return true;
    return (
      e.label.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      (e.author?.toLowerCase().includes(q) ?? false) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}
