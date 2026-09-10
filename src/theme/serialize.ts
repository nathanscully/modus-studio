// Persist the working theme as a compact, shareable URL string.
//
// To keep URLs short we store only the DIFF of the working spec against the
// chosen base preset's spec:
//   { base: <presetId>, meta?: {...}, palette?: {changed colors}, mappings?: {changed mappings} }
// Decoding merges that diff back onto a clone of the base preset's spec. Links
// made before the editor worked on specs carry the same keys, so they still
// decode: their entries simply become pinned colors and mapping overrides.

import { cloneSpec, DEFAULT_PRESET_ID, getPreset } from "./presets.ts";
import type { ThemeMeta, ThemeSpec } from "./types.ts";

interface ThemeDiff {
  base: string;
  meta?: Partial<ThemeMeta>;
  palette?: Record<string, string>;
  mappings?: Record<string, string>;
}

function changedEntries(
  current: Record<string, string | undefined>,
  base: Record<string, string | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) {
    if (v != null && v !== base[k]) out[k] = v;
  }
  return out;
}

/** Compute the minimal diff of `spec` against its base preset's spec. */
export function diffFromBase(spec: ThemeSpec, baseId: string): ThemeDiff {
  const base = getPreset(baseId)?.spec;
  const diff: ThemeDiff = { base: baseId };
  if (!base) return diff;

  const palette = changedEntries(spec.colors, base.colors);
  const mappings = changedEntries(spec.mappings, base.mappings);
  if (Object.keys(palette).length) diff.palette = palette;
  if (Object.keys(mappings).length) diff.mappings = mappings;
  const meta: Partial<ThemeMeta> = {};
  for (const key of ["name", "description", "author", "homepage", "license"] as const) {
    if (spec.meta[key] !== base.meta[key]) meta[key] = spec.meta[key];
  }
  if (Object.keys(meta).length) diff.meta = meta;
  return diff;
}

/** Rebuild a working spec by merging a diff onto a clone of its base preset's spec. */
export function applyDiff(diff: ThemeDiff): ThemeSpec {
  const preset = getPreset(diff.base) ?? getPreset(DEFAULT_PRESET_ID)!;
  const spec = cloneSpec(preset.spec);
  if (diff.meta) spec.meta = { ...spec.meta, ...diff.meta };
  if (diff.palette) Object.assign(spec.colors, diff.palette);
  if (diff.mappings) Object.assign(spec.mappings, diff.mappings);
  return spec;
}

// --- URL encoding (base64url of the JSON diff) ----------------------------

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const binary = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeToParam(spec: ThemeSpec, baseId: string): string {
  return toBase64Url(JSON.stringify(diffFromBase(spec, baseId)));
}

export function decodeFromParam(param: string): { spec: ThemeSpec; baseId: string } | null {
  try {
    const diff = JSON.parse(fromBase64Url(param)) as ThemeDiff;
    if (!diff || typeof diff.base !== "string") return null;
    return { spec: applyDiff(diff), baseId: diff.base };
  } catch {
    return null;
  }
}
