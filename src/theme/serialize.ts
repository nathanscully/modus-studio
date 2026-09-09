// Persist the working theme as a compact, shareable URL string.
//
// To keep URLs short we store only the DIFF against the chosen base preset:
//   { base: <presetId>, meta?: {...}, palette?: {diffed keys}, mappings?: {diffed keys} }
// Decoding merges that diff back onto a fresh clone of the base preset.

import { cloneDoc, DEFAULT_PRESET_ID, getPreset } from "./presets.ts";
import type { ColorKey, RoleKey } from "./palette-keys.ts";
import type { ThemeDoc } from "./types.ts";

interface ThemeDiff {
  base: string;
  meta?: Partial<ThemeDoc["meta"]>;
  palette?: Record<string, string>;
  mappings?: Record<string, string>;
}

/** Compute the minimal diff of `doc` against its base preset. */
export function diffFromBase(doc: ThemeDoc, baseId: string): ThemeDiff {
  const base = getPreset(baseId)?.doc;
  const diff: ThemeDiff = { base: baseId };

  if (base) {
    const palette: Record<string, string> = {};
    for (const [k, v] of Object.entries(doc.palette)) {
      if (v != null && v !== base.palette[k as ColorKey]) palette[k] = v;
    }
    const mappings: Record<string, string> = {};
    for (const [k, v] of Object.entries(doc.mappings)) {
      if (v != null && v !== base.mappings[k as RoleKey]) mappings[k] = v;
    }
    if (Object.keys(palette).length) diff.palette = palette;
    if (Object.keys(mappings).length) diff.mappings = mappings;
    if (
      doc.meta.name !== base.meta.name ||
      doc.meta.description !== base.meta.description ||
      doc.meta.mode !== base.meta.mode
    ) {
      diff.meta = doc.meta;
    }
  }
  return diff;
}

/** Rebuild a full ThemeDoc by merging a diff onto a clone of its base preset. */
export function applyDiff(diff: ThemeDiff): ThemeDoc {
  const preset = getPreset(diff.base) ?? getPreset(DEFAULT_PRESET_ID)!;
  const doc = cloneDoc(preset.doc);
  if (diff.meta) doc.meta = { ...doc.meta, ...diff.meta };
  if (diff.palette) Object.assign(doc.palette, diff.palette);
  if (diff.mappings) Object.assign(doc.mappings, diff.mappings);
  return doc;
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

export function encodeToParam(doc: ThemeDoc, baseId: string): string {
  return toBase64Url(JSON.stringify(diffFromBase(doc, baseId)));
}

export function decodeFromParam(param: string): { doc: ThemeDoc; baseId: string } | null {
  try {
    const diff = JSON.parse(fromBase64Url(param)) as ThemeDiff;
    if (!diff || typeof diff.base !== "string") return null;
    return { doc: applyDiff(diff), baseId: diff.base };
  } catch {
    return null;
  }
}
