// Turn a resolved ThemeDoc into a set of CSS custom properties for the preview.
//
// Every Modus color key and role becomes a `--modus-<key>` variable so preview
// markup can reference colors by name (e.g. color: var(--modus-keyword)) and the
// whole frame re-themes live whenever the doc changes.

import { COLOR_KEYS } from "./palette-keys.ts";
import { resolveAll } from "./resolve.ts";
import type { ThemeDoc } from "./types.ts";

export function themeCssVars(doc: ThemeDoc): Record<string, string> {
  const vars: Record<string, string> = {};

  // Layer 1: named colors, straight from the palette.
  for (const key of COLOR_KEYS) {
    const hex = doc.palette[key];
    if (hex) vars[`--modus-${key}`] = hex;
  }

  // Layer 2: resolved roles. A role overrides any same-named color var, which is
  // fine since color keys and role keys do not collide.
  for (const [role, hex] of Object.entries(resolveAll(doc))) {
    vars[`--modus-${role}`] = hex;
  }

  return vars;
}
