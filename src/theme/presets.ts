// Bundled starting-point themes, rebuilt from the on-disk theme files
// (themes/**/*.json) via the loader. Modus is the base family; the ef-themes are
// built on top of modus-themes (since ef 2.0) so they port faithfully and export
// as self-contained modus-themes derivatives. The classic schemes (Solarized,
// Nord) ship as partials, expanded through the verified generatePalette.
//
// Groups map to collections: Modus / Ef — light / Ef — dark / Classic /
// Community (empty groups are omitted). Preset ids are the theme-file stems and
// are stable — `?t=` diffs in shared links reference them.

import { ALL_PRESETS, PRESET_GROUPS } from "./loader.ts";
import type { Preset, ThemeDoc, ThemeSpec } from "./types.ts";

export { PRESET_GROUPS };

export const DEFAULT_PRESET_ID = "modus-operandi";

const BY_ID = new Map<string, Preset>(ALL_PRESETS.map((p) => [p.id, p]));

export function getPreset(id: string): Preset | undefined {
  return BY_ID.get(id);
}

/** Deep clone a ThemeDoc so edits never mutate the bundled preset. */
export function cloneDoc(doc: ThemeDoc): ThemeDoc {
  return {
    meta: { ...doc.meta },
    palette: { ...doc.palette },
    mappings: { ...doc.mappings },
  };
}

/** Deep clone a ThemeSpec so edits never mutate the bundled preset. */
export function cloneSpec(spec: ThemeSpec): ThemeSpec {
  const out: ThemeSpec = {
    kind: spec.kind,
    meta: { ...spec.meta },
    colors: { ...spec.colors },
    mappings: { ...spec.mappings },
    core: spec.core,
  };
  if (spec.preference) out.preference = spec.preference;
  return out;
}
