// Bundled starting-point themes. Modus is the base family; the ef-themes are
// built on top of modus-themes (since ef 2.0) so they port faithfully and export
// as self-contained modus-themes derivatives. The classic-theme import library
// (Solarized, Gruvbox, …) is deferred to a later phase.

import { efSummer } from "./ef-summer.ts";
import { modusOperandi } from "./modus-operandi.ts";
import { modusVivendi } from "./modus-vivendi.ts";
import type { Preset, ThemeDoc } from "./types.ts";

/** Presets grouped by family, for a grouped picker. Order = display order. */
export const PRESET_GROUPS: readonly { label: string; presets: readonly Preset[] }[] = [
  {
    label: "Modus",
    presets: [
      { id: "modus-operandi", label: "Modus Operandi (light)", doc: modusOperandi },
      { id: "modus-vivendi", label: "Modus Vivendi (dark)", doc: modusVivendi },
    ],
  },
  {
    label: "Ef",
    presets: [{ id: "ef-summer", label: "Ef Summer (light)", doc: efSummer }],
  },
];

// Flat list of all presets, used internally for lookup by id.
const PRESETS: readonly Preset[] = PRESET_GROUPS.flatMap((g) => g.presets);

export const DEFAULT_PRESET_ID = "modus-operandi";

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/** Deep clone a ThemeDoc so edits never mutate the bundled preset. */
export function cloneDoc(doc: ThemeDoc): ThemeDoc {
  return {
    meta: { ...doc.meta },
    palette: { ...doc.palette },
    mappings: { ...doc.mappings },
  };
}
