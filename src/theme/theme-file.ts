// The on-disk theme file format (themes/**/*.json) and its validation.
//
// A theme file is one of two shapes, discriminated on `kind`:
//   - "full"    — a fully baked ThemeDoc: an explicit palette + mappings, ready
//                 to edit/export. Modus and the ef-themes ship as full docs.
//   - "partial" — an author-style scheme (base colors + optional mappings) that
//                 is expanded at load time through the verified generatePalette
//                 (mirroring how BaseScheme was intended to be used). The classic
//                 schemes (Solarized, Nord) ship as partials.
//
// This module owns the types, a self-contained validator (shared by the loader
// and the vitest suite that gates community PRs), and the expansion of a partial
// into a Preset. Keep it dependency-light: it must run both in Vite (browser)
// and under Node/vitest.

import { generatePalette, isDark, isWarm } from "./generate-palette.ts";
import { COLOR_KEYS, isColorKey, ROLE_KEYS, type ColorKey, type RoleKey } from "./palette-keys.ts";
import { isHex, resolveRole, UNSPECIFIED } from "./resolve.ts";
import type { Mapping, Palette, Preset, ThemeDoc, ThemeMeta, ThemeMode } from "./types.ts";

export type ThemeFileKind = "full" | "partial" | "source";

export interface ThemeFileMeta {
  name: string;
  label: string;
  description: string;
  mode: ThemeMode;
  author?: string;
  homepage?: string;
  license?: string;
  tags?: readonly string[];
}

/** Where a resolved theme came from: the pinned upstream files it was read from. */
export interface ThemeProvenance {
  repo: string;
  rev: string;
  files: readonly string[];
  theme: string;
  url: string;
  api: "modus-5" | "modus-4";
  customFaces: number;
  install?: string;
}

// The four built-in collections, in gallery/picker display order. Community is
// last; extra directories under themes/ default to "community".
export type Collection = "modus" | "ef" | "classic" | "community";

export interface FullThemeFile {
  kind: "full";
  id: string;
  meta: ThemeFileMeta;
  palette: Palette;
  mappings: Mapping;
  collection?: Collection;
  /** Set when this palette is one of the engine's core palettes (modus-themes-*-palette). */
  coreSymbol?: string;
  source?: ThemeProvenance;
}

export interface PartialThemeFile {
  kind: "partial";
  id: string;
  meta: ThemeFileMeta;
  preference?: "cool" | "warm";
  base: Palette;
  mappings?: Mapping;
  /** Core palette symbol to fill from; absent means the engine's default rule. */
  core?: string;
  collection?: Collection;
  source?: ThemeProvenance;
}

/**
 * A pointer to a theme that lives in its author's repo. The resolver
 * (scripts/resolve-themes.ts) fetches the listed files at `rev`, reads the
 * palette out of the elisp and writes a full or partial file to
 * themes/resolved/ for the loader. `meta` entries override what the upstream
 * header says.
 */
export interface SourceThemeFile {
  kind: "source";
  id: string;
  source: {
    repo: string;
    rev: string;
    files: readonly string[];
    theme: string;
  };
  install?: string;
  meta?: Partial<
    Pick<ThemeFileMeta, "label" | "description" | "author" | "homepage" | "license" | "tags">
  >;
}

export type ThemeFile = FullThemeFile | PartialThemeFile | SourceThemeFile;
/** A theme file the loader can turn into a doc without network access. */
export type ResolvedThemeFile = FullThemeFile | PartialThemeFile;

// --- validation -------------------------------------------------------------

const COLOR_KEY_SET: ReadonlySet<string> = new Set(COLOR_KEYS);
const ROLE_KEY_SET: ReadonlySet<string> = new Set(ROLE_KEYS);
const MODES: ReadonlySet<string> = new Set<ThemeMode>(["light", "dark"]);
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** A validation problem tied to a specific file, keyed for actionable messages. */
export interface ThemeFileIssue {
  file: string;
  message: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when a mapping value is a known ColorKey, RoleKey, "#rrggbb", or the sentinel. */
function isValidMappingValue(value: string): boolean {
  return (
    value === UNSPECIFIED || isColorKey(value) || ROLE_KEY_SET.has(value) || HEX_RE.test(value)
  );
}

/**
 * Validate one parsed theme file against the format rules. `stem` is the file
 * name without extension (the id must equal it). Returns a list of issues; an
 * empty list means the file is valid. Messages name the offending key/value so a
 * contributor can fix the file without reading this code.
 */
export function validateThemeFile(value: unknown, stem: string): ThemeFileIssue[] {
  const issues: ThemeFileIssue[] = [];
  const file = `${stem}.json`;
  const add = (message: string) => issues.push({ file, message });

  if (!isPlainObject(value)) {
    add("root must be a JSON object");
    return issues;
  }

  if (value.kind !== "full" && value.kind !== "partial" && value.kind !== "source") {
    add(`"kind" must be "full", "partial" or "source" (got ${JSON.stringify(value.kind)})`);
    return issues;
  }
  const kind = value.kind;

  if (typeof value.id !== "string") {
    add(`"id" must be a string`);
  } else if (value.id !== stem) {
    add(`"id" ("${value.id}") must equal the file stem ("${stem}")`);
  }

  if (kind === "source") {
    validateSource(value.source, add);
    if (value.install !== undefined && typeof value.install !== "string") {
      add(`"install" must be a string when present`);
    }
    if (value.meta !== undefined) validateMetaOverrides(value.meta, add);
    return issues;
  }

  validateMeta(value.meta, add);
  if (value.core !== undefined && typeof value.core !== "string") {
    add(`"core" must be a palette symbol string when present`);
  }

  const palette = kind === "full" ? value.palette : value.base;
  const paletteField = kind === "full" ? "palette" : "base";
  const paletteColors = validatePalette(palette, paletteField, add);

  if (value.mappings !== undefined) {
    validateMappings(value.mappings, paletteColors, add);
  }

  if (kind === "full") {
    if (value.mappings === undefined) add(`"mappings" is required for kind "full"`);
  } else {
    if (!paletteColors.has("bg-main")) add(`"base" must include "bg-main" for kind "partial"`);
    if (!paletteColors.has("fg-main")) add(`"base" must include "fg-main" for kind "partial"`);
    if (
      value.preference !== undefined &&
      value.preference !== "cool" &&
      value.preference !== "warm"
    ) {
      add(`"preference" must be "cool" or "warm" when present`);
    }
  }

  // Resolution/expansion checks only run on structurally clean files: a single
  // bad hex would otherwise cascade into one error per role that falls back to
  // it, burying the actual mistake.
  const hasErrors = issues.some((i) => !i.message.startsWith("warning:"));
  if (!hasErrors) {
    if (kind === "full") {
      validateFullResolves(value as unknown as FullThemeFile, add);
    } else {
      validatePartialExpands(value as unknown as PartialThemeFile, add);
    }
  }

  const declaredMode = isPlainObject(value.meta) ? value.meta.mode : undefined;
  validateModeLuminance(declaredMode, palette, add);

  return issues;
}

const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const REV_RE = /^[0-9a-f]{40}$/;

function validateSource(source: unknown, add: (m: string) => void): void {
  if (!isPlainObject(source)) {
    add(`"source" must be an object with repo, rev, files and theme`);
    return;
  }
  if (typeof source.repo !== "string" || !REPO_RE.test(source.repo)) {
    add(`"source.repo" must be a GitHub "owner/name" (got ${JSON.stringify(source.repo)})`);
  }
  if (typeof source.rev !== "string" || !REV_RE.test(source.rev)) {
    add(`"source.rev" must be a full 40-character commit SHA (got ${JSON.stringify(source.rev)})`);
  }
  if (
    !Array.isArray(source.files) ||
    source.files.length === 0 ||
    source.files.some((f) => typeof f !== "string" || !f.endsWith(".el"))
  ) {
    add(`"source.files" must be a non-empty array of .el paths in the repo`);
  }
  if (typeof source.theme !== "string" || source.theme === "") {
    add(`"source.theme" must be the theme symbol passed to modus-themes-theme`);
  }
}

function validateMetaOverrides(meta: unknown, add: (m: string) => void): void {
  if (!isPlainObject(meta)) {
    add(`"meta" must be an object when present`);
    return;
  }
  for (const key of ["label", "description", "author", "homepage", "license"] as const) {
    if (meta[key] !== undefined && typeof meta[key] !== "string") {
      add(`"meta.${key}" must be a string when present`);
    }
  }
  if (meta.tags !== undefined) {
    if (!Array.isArray(meta.tags) || meta.tags.some((t) => typeof t !== "string")) {
      add(`"meta.tags" must be an array of strings when present`);
    }
  }
}

function validateMeta(meta: unknown, add: (m: string) => void): void {
  if (!isPlainObject(meta)) {
    add(`"meta" must be an object`);
    return;
  }
  for (const key of ["name", "label", "description"] as const) {
    if (typeof meta[key] !== "string" || meta[key] === "") {
      add(`"meta.${key}" must be a non-empty string`);
    }
  }
  if (typeof meta.mode !== "string" || !MODES.has(meta.mode)) {
    add(`"meta.mode" must be "light" or "dark"`);
  }
  for (const key of ["author", "homepage", "license"] as const) {
    if (meta[key] !== undefined && typeof meta[key] !== "string") {
      add(`"meta.${key}" must be a string when present`);
    }
  }
  if (meta.tags !== undefined) {
    if (!Array.isArray(meta.tags) || meta.tags.some((t) => typeof t !== "string")) {
      add(`"meta.tags" must be an array of strings when present`);
    }
  }
}

function validatePalette(palette: unknown, field: string, add: (m: string) => void): Set<string> {
  const present = new Set<string>();
  if (!isPlainObject(palette)) {
    add(`"${field}" must be an object`);
    return present;
  }
  for (const [key, hex] of Object.entries(palette)) {
    // Palette keys are ColorKeys, plus the two roles the engine also treats as
    // named colors (cursor, fg-mode-line-active — see the architecture doc).
    // Upstream themes may add their own named colors (jinlor's elysia-pink);
    // those are kept and exported, but flagged so the editor's grouped view is
    // known to omit them.
    if (!COLOR_KEY_SET.has(key) && !ROLE_KEY_SET.has(key)) {
      if (!/^[a-z][a-z0-9-]*$/.test(key)) {
        add(`"${field}.${key}" is not a valid color name`);
        continue;
      }
      add(
        `warning: "${field}.${key}" is not a Modus color name; it is kept but not shown in the editor`,
      );
    }
    if (typeof hex !== "string" || !HEX_RE.test(hex)) {
      add(`"${field}.${key}" must be a #rrggbb hex string (got ${JSON.stringify(hex)})`);
      continue;
    }
    present.add(key);
  }
  return present;
}

function validateMappings(
  mappings: unknown,
  paletteColors: ReadonlySet<string>,
  add: (m: string) => void,
): void {
  if (!isPlainObject(mappings)) {
    add(`"mappings" must be an object`);
    return;
  }
  for (const [key, value] of Object.entries(mappings)) {
    // Most mapping keys are RoleKeys. A handful of entries the engine treats as
    // mappings are ColorKeys in our vocabulary (e.g. bg-region, bg-completion,
    // the mode-line colors) — generatePalette/resolve accept those too. A key
    // outside both is something the engine's faces never read (an upstream
    // theme's private role), so it is kept but flagged.
    if (!ROLE_KEY_SET.has(key) && !COLOR_KEY_SET.has(key)) {
      if (!/^[a-z][a-z0-9-]*$/.test(key)) {
        add(`"mappings.${key}" is not a valid role name`);
        continue;
      }
      add(`warning: "mappings.${key}" is not a Modus role; the engine's faces ignore it`);
    }
    if (typeof value !== "string") {
      add(`"mappings.${key}" must be a string (got ${JSON.stringify(value)})`);
      continue;
    }
    // A value may name any color the theme itself defines, including ones
    // outside the Modus vocabulary. A symbol that names nothing resolves to
    // `unspecified` in Emacs, so it is a warning, not an error.
    if (isValidMappingValue(value) || paletteColors.has(value)) continue;
    if (!/^[a-z][a-z0-9-]*$/.test(value)) {
      add(
        `"mappings.${key}" must be a color name, role name, #rrggbb hex, or "unspecified" (got ${JSON.stringify(value)})`,
      );
      continue;
    }
    add(
      `warning: "mappings.${key}" names "${value}", which nothing defines; Emacs treats it as unspecified`,
    );
  }
}

// Roles whose absence would leave code highlighting broken; a full doc must
// resolve each of these to a concrete hex through resolve.ts.
const SYNTAX_CRITICAL_ROLES: readonly RoleKey[] = [
  "keyword",
  "string",
  "comment",
  "constant",
  "fnname",
  "type",
  "variable",
  "builtin",
];

function validateFullResolves(file: FullThemeFile, add: (m: string) => void): void {
  const doc: ThemeDoc = {
    meta: { name: file.meta.name, description: file.meta.description, mode: file.meta.mode },
    palette: file.palette ?? {},
    mappings: file.mappings ?? {},
  };
  for (const role of SYNTAX_CRITICAL_ROLES) {
    const hex = resolveRole(doc, role) ?? resolveViaColorKey(doc, role);
    if (hex == null) {
      add(`syntax-critical role "${role}" does not resolve to a color (kind "full")`);
    }
  }
}

// A role with no explicit mapping falls back to a like-named ColorKey if the
// palette defines one (mirrors how the app resolves an unmapped syntax role).
function resolveViaColorKey(doc: ThemeDoc, role: string): string | null {
  if (isColorKey(role)) return doc.palette[role] ?? null;
  return null;
}

function validatePartialExpands(file: PartialThemeFile, add: (m: string) => void): void {
  try {
    expandPartial(file);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    add(`partial failed to expand via generatePalette: ${reason}`);
  }
}

function validateModeLuminance(
  declaredMode: unknown,
  palette: unknown,
  add: (m: string) => void,
): void {
  if (!isPlainObject(palette)) return;
  const bg = palette["bg-main"];
  if (typeof bg !== "string" || !HEX_RE.test(bg)) return;
  const looksDark = relativeLuminance(bg) < 0.5;
  const declaredDark = declaredMode === "dark";
  if (looksDark !== declaredDark) {
    add(
      `warning: meta.mode is "${String(declaredMode)}" but bg-main ${bg} looks ${looksDark ? "dark" : "light"}`,
    );
  }
}

function relativeLuminance(hex: string): number {
  const h = hex.slice(1);
  const chan = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255;
  const [r, g, b] = [chan(0), chan(2), chan(4)];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// --- expansion --------------------------------------------------------------

const CORE_SYMBOL_RE =
  /^modus-themes-(operandi|vivendi)(-tinted|-deuteranopia|-tritanopia)?-palette$/;

/**
 * The engine's default core when a partial names none: operandi or vivendi by
 * background darkness, and the tinted variant when the background reads as
 * warm (mirrors `modus-themes-generate-palette`).
 */
export function defaultCoreSymbol(bgMain: string, preference?: "cool" | "warm"): string {
  const prefersCool = preference ? preference === "cool" : !isWarm(bgMain);
  const base = isDark(bgMain) ? "vivendi" : "operandi";
  return `modus-themes-${base}${prefersCool ? "" : "-tinted"}-palette`;
}

/**
 * Expand a partial theme file into a full ThemeDoc via generatePalette, filling
 * the remainder from the named core (or the engine's default core for its
 * background). `core` supplies both the CORE-PALETTE colors and the CORE
 * mappings so a generated theme is complete and highlights code like Modus does.
 */
export function expandPartial(file: PartialThemeFile, core?: ThemeDoc): ThemeDoc {
  const bgMain = file.base["bg-main"];
  const symbol = file.core ?? defaultCoreSymbol(bgMain ?? "#ffffff", file.preference);
  const coreDoc = core ?? getCore(symbol, file.meta.mode);
  const { palette, mappings } = generatePalette(file.base, {
    corePalette: coreDoc.palette,
    coreMappings: coreDoc.mappings,
    mappings: file.mappings,
    preference: file.preference,
  });
  return { meta: metaOf(file.meta), palette, mappings };
}

function metaOf(meta: ThemeFileMeta): ThemeMeta {
  return {
    name: meta.name,
    description: meta.description,
    mode: meta.mode,
    author: meta.author,
    homepage: meta.homepage,
    license: meta.license,
    tags: meta.tags,
  };
}

/** Turn a resolved theme file into an editor-ready ThemeDoc. */
export function toThemeDoc(file: ResolvedThemeFile, core?: ThemeDoc): ThemeDoc {
  if (file.kind === "full") {
    return {
      meta: metaOf(file.meta),
      palette: { ...file.palette },
      mappings: { ...file.mappings },
    };
  }
  return expandPartial(file, core);
}

/** Turn a resolved theme file into a Preset (id + label + doc). */
export function toPreset(file: ResolvedThemeFile, core?: ThemeDoc): Preset {
  return { id: file.id, label: file.meta.label, doc: toThemeDoc(file, core) };
}

// The core palettes are supplied by the loader (they are themselves full theme
// files carrying `coreSymbol`). expandPartial needs them; the loader wires this
// in before use so this module stays free of a static import cycle.
const cores = new Map<string, ThemeDoc>();

/** Register a core palette under its engine symbol, e.g. modus-themes-operandi-palette. */
export function registerCore(symbol: string, doc: ThemeDoc): void {
  cores.set(symbol, doc);
}

/** Convenience for the two classic cores, kept for callers that predate the eight. */
export function registerModusCores(light: ThemeDoc, dark: ThemeDoc): void {
  registerCore("modus-themes-operandi-palette", light);
  registerCore("modus-themes-vivendi-palette", dark);
}

/**
 * The core palette for `symbol`. When that exact variant is not registered
 * (a build with only operandi and vivendi), fall back to the plain core for
 * the mode so expansion still succeeds.
 */
export function getCore(symbol: string, mode: ThemeMode): ThemeDoc {
  const exact = cores.get(symbol);
  if (exact) return exact;
  if (!CORE_SYMBOL_RE.test(symbol)) {
    throw new Error(`unknown core palette "${symbol}"`);
  }
  return getModusCore(mode);
}

export function getModusCore(mode: ThemeMode): ThemeDoc {
  const doc = cores.get(
    mode === "dark" ? "modus-themes-vivendi-palette" : "modus-themes-operandi-palette",
  );
  if (!doc) {
    throw new Error(
      "modus core themes not registered; call registerCore before expanding partials",
    );
  }
  return doc;
}

export type { ColorKey, RoleKey, ThemeMeta };
export { isHex };
