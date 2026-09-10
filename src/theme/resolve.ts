// Resolve semantic roles down to concrete hex colors.
//
// A mapping value is one of:
//   - a layer-1 color name  -> look up its hex in the palette
//   - a raw hex string      -> use as-is
//   - another semantic role -> follow that role's mapping (e.g. the ef-themes
//                              point `fg-heading-0` at `rainbow-0`, and
//                              `fg-completion-match-0` at `accent-0`)
//   - "unspecified"         -> Emacs sentinel; the role inherits / isn't themed
//
// The modus-themes engine resolves a mapping that names another mapping by
// chaining through it, so we do the same (with cycle protection).

import { ROLE_KEYS, type RoleKey } from "./palette-keys.ts";
import type { MappingValue, ThemeDoc } from "./types.ts";

/** The Emacs sentinel meaning "do not theme this role". */
export const UNSPECIFIED = "unspecified";

export function isHex(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

/**
 * Resolve a single mapping value to a hex string, or `null` when it is
 * "unspecified", points at a color name absent from the palette, or chains to an
 * unresolvable role. Follows role->role indirection, guarding against cycles.
 */
export function resolveValue(
  doc: ThemeDoc,
  value: MappingValue | undefined,
  seen: Set<string> = new Set(),
): string | null {
  if (value == null || value === UNSPECIFIED) return null;
  if (isHex(value)) return value;
  // Mirrors modus-themes--retrieve-palette-value: a name is looked up in the
  // theme's own palette first (any named color, including ones outside the
  // Modus vocabulary), then followed as a role, recursing until a string.
  const hex = (doc.palette as Record<string, string | undefined>)[value];
  if (hex) return hex;
  const next = (doc.mappings as Record<string, MappingValue | undefined>)[value];
  if (next != null && !seen.has(value)) {
    seen.add(value);
    return resolveValue(doc, next, seen);
  }
  return null;
}

/**
 * Resolve one role to a hex string, or `null` if unspecified/unresolved. A role
 * the theme defines as a named color instead of a mapping (the ef-themes do
 * this with `cursor`) resolves to that color, as the engine's lookup by symbol
 * does not care which layer an entry sits in.
 */
export function resolveRole(doc: ThemeDoc, role: RoleKey): string | null {
  const mapped = doc.mappings[role];
  if (mapped != null) return resolveValue(doc, mapped);
  return (doc.palette as Record<string, string | undefined>)[role] ?? null;
}

/** Resolve every role to a hex (omitting roles that resolve to null). */
export function resolveAll(doc: ThemeDoc): Partial<Record<RoleKey, string>> {
  const out: Partial<Record<RoleKey, string>> = {};
  for (const role of ROLE_KEYS) {
    const hex = resolveRole(doc, role);
    if (hex) out[role] = hex;
  }
  return out;
}
