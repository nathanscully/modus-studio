// Extract a theme definition from parsed elisp forms. This is a tiny evaluator
// for the data subset theme files use — quoted alists, `append`, `list`,
// symbol references, and `modus-themes-generate-palette` (run through our
// verified TypeScript port) — plus recognition of the two `modus-themes-theme`
// call shapes. Everything else is either skipped (function definitions,
// requires, autoload cookies) or, when a needed value depends on it, reported
// as an error naming the file, line and form.

import { generatePalette, isDark, isWarm } from "../generate-palette.ts";
import type { Mapping, Palette, ThemeMode } from "../types.ts";
import { printForm, readForms, type Form } from "./reader.ts";

export type Datum =
  | string
  | number
  | null
  | { sym: string }
  | Datum[]
  | { generated: GeneratedPalette };

/** The captured inputs and output of a `modus-themes-generate-palette` call. */
export interface GeneratedPalette {
  base: PaletteAlist;
  preference: "cool" | "warm" | null;
  /** Core palette symbol passed explicitly, or null for the engine's default. */
  coreSymbol: string | null;
  /** The resolved default core when `coreSymbol` is null. */
  defaultCoreSymbol: string | null;
  mappings: MappingAlist;
  /** The full generated alist, named colors then mappings, as Emacs returns it. */
  result: PaletteAlist;
}

/** An alist entry as (NAME VALUE): VALUE is a hex string, a symbol name, or "unspecified". */
export type AlistEntry = { key: string; value: string; isSymbol: boolean };
export type PaletteAlist = AlistEntry[];
export type MappingAlist = AlistEntry[];

export interface SourceFile {
  path: string;
  text: string;
}

export interface HeaderFields {
  author?: string;
  url?: string;
  license?: string;
  version?: string;
  summary?: string;
}

export interface ExtractedTheme {
  name: string;
  family: string;
  description: string;
  mode: ThemeMode;
  api: "modus-5" | "modus-4";
  header: HeaderFields;
  /** Effective palette in Emacs's precedence: overrides, then user, then core. */
  effective: PaletteAlist;
  /** Symbol names of the palettes named in the theme call. */
  coreSymbol: string | null;
  userSymbol: string | null;
  overridesSymbol: string | null;
  /** When the theme's own palette came from generate-palette, its inputs. */
  generated: GeneratedPalette | null;
  customFacesCount: number;
  /** The file that holds the theme call. */
  file: string;
}

export class ExtractError extends Error {
  readonly file: string;
  readonly line: number | null;

  constructor(message: string, file: string, line: number | null) {
    super(line == null ? `${file}: ${message}` : `${file}:${line}: ${message}`);
    this.name = "ExtractError";
    this.file = file;
    this.line = line;
  }
}

/**
 * Named palettes the files may reference without defining, keyed by symbol
 * name (for example `modus-themes-vivendi-palette`, provided once the Modus
 * core has been resolved).
 */
export type Externals = ReadonlyMap<string, PaletteAlist>;

type ListForm = Extract<Form, { kind: "list" }>;

interface Definition {
  form: Form;
  file: string;
}

interface ThemeCall {
  form: ListForm;
  file: string;
  /** Description from a preceding `deftheme` when using the 4.x macro. */
  deftheme?: Form;
}

/** Parse the files, collect definitions and theme calls, and extract `themeName`. */
export function extractTheme(
  files: readonly SourceFile[],
  themeName: string,
  externals: Externals = new Map(),
): ExtractedTheme {
  const env = new Environment(externals);
  const calls: ThemeCall[] = [];
  const defthemes = new Map<string, Form>();
  let header: HeaderFields = {};

  for (const file of files) {
    const forms = readForms(file.text, file.path);
    if (file.path.endsWith(`${themeName}-theme.el`) || files.length === 1) {
      header = parseHeader(file.text);
    }
    collect(forms, file.path, env, calls, defthemes);
  }

  const call = calls.find((c) => themeCallName(c.form) === themeName);
  if (!call) {
    const seen = calls.map((c) => themeCallName(c.form)).filter(Boolean);
    throw new ExtractError(
      `no (modus-themes-theme ...) call for "${themeName}"${seen.length ? `; found ${seen.join(", ")}` : ""}`,
      files[0]?.path ?? "<none>",
      null,
    );
  }
  const deftheme = defthemes.get(themeName);
  return call.form.items.length >= 8 || isQuotedSymbol(call.form.items[1])
    ? extractModus5(call, env, header)
    : extractModus4(call, deftheme, env, header);
}

/**
 * Evaluate named palette variables defined across `files`, for example the
 * eight `modus-themes-*-palette` cores in modus-themes.el, so they can be
 * handed to later extractions as externals.
 */
export function evaluatePalettes(
  files: readonly SourceFile[],
  names: readonly string[],
  externals: Externals = new Map(),
): Map<string, PaletteAlist> {
  const env = new Environment(externals);
  const calls: ThemeCall[] = [];
  const defthemes = new Map<string, Form>();
  for (const file of files) {
    collect(readForms(file.text, file.path), file.path, env, calls, defthemes);
  }
  const out = new Map<string, PaletteAlist>();
  for (const name of names) {
    out.set(name, dedupe(env.paletteValue(name, files[0]?.path ?? "<none>", null)));
  }
  return out;
}

// --- collection -------------------------------------------------------------

const DEFINERS = new Set(["defconst", "defvar", "defcustom", "defvar-local"]);
const TRANSPARENT = new Set([
  "eval-and-compile",
  "eval-when-compile",
  "progn",
  "prog1",
  "when",
  "unless",
]);

function collect(
  forms: readonly Form[],
  file: string,
  env: Environment,
  calls: ThemeCall[],
  defthemes: Map<string, Form>,
): void {
  for (const form of forms) {
    if (form.kind !== "list" || form.items.length === 0) continue;
    const head = form.items[0];
    if (head?.kind !== "symbol") continue;
    if (DEFINERS.has(head.name)) {
      const nameForm = form.items[1];
      if (nameForm?.kind === "symbol" && form.items[2]) {
        env.define(nameForm.name, { form: form.items[2], file });
      }
      continue;
    }
    if (head.name === "modus-themes-theme") {
      calls.push({ form, file });
      continue;
    }
    if (head.name === "deftheme") {
      const nameForm = form.items[1];
      if (nameForm?.kind === "symbol") defthemes.set(nameForm.name, form);
      continue;
    }
    if (TRANSPARENT.has(head.name)) {
      collect(form.items.slice(1), file, env, calls, defthemes);
    }
  }
}

function themeCallName(form: ListForm): string | null {
  const arg = form.items[1];
  if (!arg) return null;
  if (arg.kind === "quote" && arg.form.kind === "symbol") return arg.form.name;
  if (arg.kind === "symbol") return arg.name;
  return null;
}

function isQuotedSymbol(form: Form | undefined): boolean {
  return form?.kind === "quote" && form.form.kind === "symbol";
}

// --- the two API shapes -----------------------------------------------------

function extractModus5(call: ThemeCall, env: Environment, header: HeaderFields): ExtractedTheme {
  const [, nameF, familyF, descF, modeF, coreF, userF, overridesF, facesF] = call.form.items;
  const name = symbolArg(nameF, call.file, "NAME");
  const family = symbolArg(familyF, call.file, "FAMILY");
  const description = descF?.kind === "string" ? descF.value : "";
  const mode = modeArg(symbolArg(modeF, call.file, "BACKGROUND-MODE"), call.file, modeF);
  const coreSymbol = optionalSymbolArg(coreF, call.file, "CORE-PALETTE");
  const userSymbol = optionalSymbolArg(userF, call.file, "USER-PALETTE");
  const overridesSymbol = optionalSymbolArg(overridesF, call.file, "OVERRIDES-PALETTE");
  const facesSymbol = optionalSymbolArg(facesF, call.file, "CUSTOM-FACES");

  const core = coreSymbol ? env.paletteValue(coreSymbol, call.file, coreF?.line ?? null) : [];
  const userDatum = userSymbol ? env.value(userSymbol, call.file, userF?.line ?? null) : null;
  const overrides = overridesSymbol
    ? env.paletteValue(overridesSymbol, call.file, overridesF?.line ?? null)
    : [];
  const coreDatum = coreSymbol ? env.value(coreSymbol, call.file, coreF?.line ?? null) : null;

  const generated = generatedOf(userDatum) ?? generatedOf(coreDatum);
  const user = userDatum == null ? [] : toAlist(userDatum, call.file, userF?.line ?? null);

  return {
    name,
    family,
    description,
    mode,
    api: "modus-5",
    header,
    effective: dedupe([...overrides, ...user, ...core]),
    coreSymbol,
    userSymbol,
    overridesSymbol,
    generated,
    customFacesCount: facesSymbol ? countList(env.tryValue(facesSymbol)) : 0,
    file: call.file,
  };
}

function extractModus4(
  call: ThemeCall,
  deftheme: Form | undefined,
  env: Environment,
  header: HeaderFields,
): ExtractedTheme {
  const [, nameF, paletteF, overridesF] = call.form.items;
  const name = bareSymbolArg(nameF, call.file, "NAME");
  const paletteSymbol = bareSymbolArg(paletteF, call.file, "PALETTE");
  const overridesSymbol = overridesF ? bareSymbolArg(overridesF, call.file, "OVERRIDES") : null;
  const paletteDatum = env.value(paletteSymbol, call.file, paletteF?.line ?? null);
  const palette = toAlist(paletteDatum, call.file, paletteF?.line ?? null);
  const overrides = overridesSymbol
    ? env.paletteValue(overridesSymbol, call.file, overridesF?.line ?? null)
    : [];

  let description = "";
  let mode: ThemeMode | null = null;
  if (deftheme?.kind === "list") {
    const desc = deftheme.items[2];
    if (desc?.kind === "string") description = desc.value;
    for (let i = 3; i + 1 < deftheme.items.length; i += 2) {
      const key = deftheme.items[i];
      const val = deftheme.items[i + 1];
      if (key?.kind === "symbol" && key.name === ":background-mode" && val) {
        mode = modeArg(symbolArg(val, call.file, ":background-mode"), call.file, val);
      }
    }
  }
  if (!mode) {
    const bg = palette.find((e) => e.key === "bg-main" && !e.isSymbol);
    mode = bg && isDark(bg.value) ? "dark" : "light";
  }

  return {
    name,
    family: name,
    description,
    mode,
    api: "modus-4",
    header,
    effective: dedupe([...overrides, ...palette]),
    coreSymbol: paletteSymbol,
    userSymbol: null,
    overridesSymbol,
    generated: generatedOf(paletteDatum),
    customFacesCount: 0,
    file: call.file,
  };
}

function symbolArg(form: Form | undefined, file: string, what: string): string {
  if (form?.kind === "quote" && form.form.kind === "symbol") return form.form.name;
  if (form?.kind === "symbol") return form.name;
  throw new ExtractError(
    `expected a quoted symbol for ${what}, got ${form ? printForm(form) : "nothing"}`,
    file,
    form?.line ?? null,
  );
}

function bareSymbolArg(form: Form | undefined, file: string, what: string): string {
  if (form?.kind === "symbol") return form.name;
  throw new ExtractError(
    `expected a bare symbol for ${what}, got ${form ? printForm(form) : "nothing"}`,
    file,
    form?.line ?? null,
  );
}

function optionalSymbolArg(form: Form | undefined, file: string, what: string): string | null {
  if (!form) return null;
  if (form.kind === "symbol" && form.name === "nil") return null;
  if (form.kind === "quote" && form.form.kind === "symbol" && form.form.name === "nil") return null;
  return symbolArg(form, file, what);
}

function modeArg(value: string, file: string, form: Form | undefined): ThemeMode {
  if (value === "light" || value === "dark") return value;
  throw new ExtractError(
    `BACKGROUND-MODE must be light or dark, got ${value}`,
    file,
    form?.line ?? null,
  );
}

function generatedOf(datum: Datum | null): GeneratedPalette | null {
  if (datum && typeof datum === "object" && !Array.isArray(datum) && "generated" in datum) {
    return datum.generated;
  }
  return null;
}

function countList(datum: Datum | null): number {
  return Array.isArray(datum) ? datum.length : 0;
}

/** First entry per key wins, like Emacs's alist lookup over an `append`. */
export function dedupe(entries: readonly AlistEntry[]): PaletteAlist {
  const seen = new Set<string>();
  const out: AlistEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.key)) continue;
    seen.add(e.key);
    out.push(e);
  }
  return out;
}

// --- header -----------------------------------------------------------------

/** Read the `;; Key: value` header block of a package file. */
export function parseHeader(text: string): HeaderFields {
  const out: HeaderFields = {};
  const first = text.split("\n", 1)[0] ?? "";
  const summary = /^;;;\s*\S+\s+---\s+(.*?)(\s+-\*-.*)?$/.exec(first);
  if (summary?.[1]) out.summary = summary[1].trim();
  for (const line of text.split("\n").slice(0, 60)) {
    const m = /^;;\s*([A-Za-z-]+):\s*(.+?)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const value = m[2]!;
    if (key === "author" && !out.author) out.author = value.replace(/\s*<[^>]*>\s*$/, "");
    else if ((key === "url" || key === "homepage") && !out.url) out.url = value;
    else if (key === "spdx-license-identifier" && !out.license) out.license = value;
    else if (key === "version" && !out.version) out.version = value;
  }
  return out;
}

// --- evaluation -------------------------------------------------------------

class Environment {
  private readonly defs = new Map<string, Definition>();
  private readonly cache = new Map<string, Datum>();
  private readonly evaluating = new Set<string>();
  private readonly externals: Externals;

  constructor(externals: Externals) {
    this.externals = externals;
  }

  define(name: string, def: Definition): void {
    if (!this.defs.has(name)) this.defs.set(name, def);
  }

  tryValue(name: string): Datum | null {
    try {
      return this.value(name, "<lookup>", null);
    } catch {
      return null;
    }
  }

  value(name: string, file: string, line: number | null): Datum {
    if (this.cache.has(name)) return this.cache.get(name)!;
    const def = this.defs.get(name);
    if (!def) {
      const ext = this.externals.get(name) ?? this.externals.get(obsoleteCoreAlias(name) ?? "");
      if (ext) {
        const datum = alistToDatum(ext);
        this.cache.set(name, datum);
        return datum;
      }
      throw new ExtractError(`symbol "${name}" is not defined in the listed files`, file, line);
    }
    if (this.evaluating.has(name)) {
      throw new ExtractError(`circular definition of "${name}"`, def.file, def.form.line);
    }
    this.evaluating.add(name);
    try {
      const datum = this.evalForm(def.form, def.file);
      this.cache.set(name, datum);
      return datum;
    } finally {
      this.evaluating.delete(name);
    }
  }

  paletteValue(name: string, file: string, line: number | null): PaletteAlist {
    return toAlist(this.value(name, file, line), file, line);
  }

  evalForm(form: Form, file: string): Datum {
    switch (form.kind) {
      case "string":
        return form.value;
      case "number":
        return form.value;
      case "char":
        return form.source;
      case "symbol":
        if (form.name === "nil") return null;
        if (form.name === "t") return { sym: "t" };
        if (form.name.startsWith(":")) return { sym: form.name };
        return this.value(form.name, file, form.line);
      case "quote":
        return quoteDatum(form.form, file);
      case "backquote":
        return quoteDatum(form.form, file);
      case "function":
        return { sym: printForm(form.form) };
      case "vector":
        return form.items.map((f) => this.evalForm(f, file));
      case "unquote":
        throw new ExtractError("unquote outside backquote", file, form.line);
      case "list":
        return this.evalCall(form, file);
    }
  }

  private evalCall(form: Extract<Form, { kind: "list" }>, file: string): Datum {
    const head = form.items[0];
    if (head?.kind !== "symbol") {
      throw new ExtractError(`cannot evaluate ${printForm(form)}`, file, form.line);
    }
    const args = form.items.slice(1);
    switch (head.name) {
      case "append": {
        const out: Datum[] = [];
        for (const a of args) {
          const v = this.evalForm(a, file);
          if (v == null) continue;
          if (!Array.isArray(v)) {
            throw new ExtractError(`append expects lists, got ${describe(v)}`, file, a.line);
          }
          out.push(...v);
        }
        return out;
      }
      case "list":
        return args.map((a) => this.evalForm(a, file));
      case "cons": {
        const [carF, cdrF] = args;
        if (!carF || !cdrF) throw new ExtractError("cons needs two arguments", file, form.line);
        const cdr = this.evalForm(cdrF, file);
        return [
          this.evalForm(carF, file),
          ...(Array.isArray(cdr) ? cdr : cdr == null ? [] : [cdr]),
        ];
      }
      case "quote":
        return args[0] ? quoteDatum(args[0], file) : null;
      case "identity":
        return args[0] ? this.evalForm(args[0], file) : null;
      case "purecopy":
        return args[0] ? this.evalForm(args[0], file) : null;
      case "modus-themes-generate-palette":
        return { generated: this.generate(args, file, form.line) };
      default:
        throw new ExtractError(
          `unsupported form (${head.name} ...): only quoted data, append, list and modus-themes-generate-palette are understood`,
          file,
          form.line,
        );
    }
  }

  private generate(args: readonly Form[], file: string, line: number): GeneratedPalette {
    const [baseF, prefF, coreF, mappingsF] = args;
    if (!baseF)
      throw new ExtractError("modus-themes-generate-palette needs BASE-COLORS", file, line);
    const base = toAlist(this.evalForm(baseF, file), file, baseF.line);
    const prefDatum = prefF ? this.evalForm(prefF, file) : null;
    const preference =
      prefDatum && typeof prefDatum === "object" && "sym" in prefDatum
        ? prefDatum.sym === "cool" || prefDatum.sym === "warm"
          ? prefDatum.sym
          : null
        : null;
    const coreSymbol = coreF ? symbolNameOf(coreF) : null;
    const coreDatum = coreF ? this.evalForm(coreF, file) : null;
    const mappings = mappingsF ? toAlist(this.evalForm(mappingsF, file), file, mappingsF.line) : [];

    const bgMain = base.find((e) => e.key === "bg-main" && !e.isSymbol)?.value;
    const fgMain = base.find((e) => e.key === "fg-main" && !e.isSymbol)?.value;
    if (!bgMain || !fgMain) {
      throw new ExtractError(
        "BASE-COLORS must define bg-main and fg-main as strings",
        file,
        baseF.line,
      );
    }
    const prefersCool = preference ? preference === "cool" : !isWarm(bgMain);
    const dark = isDark(bgMain);
    const defaultCoreSymbol =
      coreDatum == null
        ? dark
          ? prefersCool
            ? "modus-themes-vivendi-palette"
            : "modus-themes-vivendi-tinted-palette"
          : prefersCool
            ? "modus-themes-operandi-palette"
            : "modus-themes-operandi-tinted-palette"
        : null;
    const coreAlist =
      coreDatum == null
        ? this.paletteValue(defaultCoreSymbol!, file, line)
        : toAlist(coreDatum, file, coreF?.line ?? line);

    const { palette, mappings: outMappings } = generatePalette(alistToPalette(base), {
      preference: preference ?? undefined,
      corePalette: alistToPalette(coreAlist),
      coreMappings: alistToMapping(coreAlist),
      mappings: alistToMapping(mappings),
    });
    const result: PaletteAlist = [
      ...Object.entries(palette).map(([key, value]) => ({ key, value: value!, isSymbol: false })),
      ...Object.entries(outMappings).map(([key, value]) => ({
        key,
        value: value!,
        isSymbol: !value!.startsWith("#"),
      })),
    ];
    return { base, preference, coreSymbol, defaultCoreSymbol, mappings, result };
  }
}

// modus-themes 5 renamed the core palettes to modus-themes-*-palette and kept
// the 4.x names as obsolete variable aliases; derivative themes still use them.
function obsoleteCoreAlias(name: string): string | null {
  const m = /^modus-((?:operandi|vivendi)(?:-tinted|-deuteranopia|-tritanopia)?)-palette$/.exec(
    name,
  );
  return m ? `modus-themes-${m[1]}-palette` : null;
}

function symbolNameOf(form: Form): string | null {
  if (form.kind === "symbol" && form.name !== "nil") return form.name;
  if (form.kind === "quote" && form.form.kind === "symbol" && form.form.name !== "nil") {
    return form.form.name;
  }
  return null;
}

function quoteDatum(form: Form, file: string): Datum {
  switch (form.kind) {
    case "string":
      return form.value;
    case "number":
      return form.value;
    case "char":
      return form.source;
    case "symbol":
      return form.name === "nil" ? null : { sym: form.name };
    case "list":
      return form.items.map((f) => quoteDatum(f, file));
    case "vector":
      return form.items.map((f) => quoteDatum(f, file));
    case "quote":
      return [{ sym: "quote" }, quoteDatum(form.form, file)];
    case "backquote":
      return [{ sym: "`" }, quoteDatum(form.form, file)];
    case "unquote":
      return [{ sym: form.splice ? ",@" : "," }, quoteDatum(form.form, file)];
    case "function":
      return [{ sym: "function" }, quoteDatum(form.form, file)];
  }
}

function describe(d: Datum): string {
  if (d == null) return "nil";
  if (typeof d === "string") return `string ${JSON.stringify(d)}`;
  if (typeof d === "number") return `number ${d}`;
  if (Array.isArray(d)) return `list of ${d.length}`;
  if ("sym" in d) return `symbol ${d.sym}`;
  return "generated palette";
}

/** Coerce an evaluated datum into (NAME VALUE) entries. */
export function toAlist(datum: Datum | null, file: string, line: number | null): PaletteAlist {
  if (datum == null) return [];
  if (typeof datum === "object" && !Array.isArray(datum) && "generated" in datum) {
    return datum.generated.result;
  }
  if (!Array.isArray(datum)) {
    throw new ExtractError(`expected a palette alist, got ${describe(datum)}`, file, line);
  }
  const out: PaletteAlist = [];
  for (const entry of datum) {
    if (!Array.isArray(entry) || entry.length < 2) {
      throw new ExtractError(
        `palette entries must be (NAME VALUE), got ${JSON.stringify(entry)}`,
        file,
        line,
      );
    }
    const [k, v] = entry;
    if (k == null || typeof k !== "object" || Array.isArray(k) || !("sym" in k)) {
      throw new ExtractError(`palette entry name must be a symbol`, file, line);
    }
    if (typeof v === "string") out.push({ key: k.sym, value: v, isSymbol: false });
    else if (v == null) out.push({ key: k.sym, value: "unspecified", isSymbol: true });
    else if (typeof v === "object" && !Array.isArray(v) && "sym" in v) {
      out.push({ key: k.sym, value: v.sym, isSymbol: true });
    } else {
      throw new ExtractError(
        `palette entry ${k.sym} must map to a string or symbol, got ${describe(v)}`,
        file,
        line,
      );
    }
  }
  return out;
}

function alistToDatum(alist: PaletteAlist): Datum {
  return alist.map((e) => [{ sym: e.key }, e.isSymbol ? { sym: e.value } : e.value]);
}

export function alistToPalette(alist: PaletteAlist): Palette {
  const out: Record<string, string> = {};
  for (const e of alist) if (!e.isSymbol && !(e.key in out)) out[e.key] = e.value;
  return out as Palette;
}

export function alistToMapping(alist: PaletteAlist): Mapping {
  const out: Record<string, string> = {};
  for (const e of alist) if (e.isSymbol && !(e.key in out)) out[e.key] = e.value;
  return out as Mapping;
}
