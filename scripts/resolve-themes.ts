// Resolve every pointer theme file (kind "source") into a full or partial
// theme file under themes/resolved/, by fetching the pinned upstream .el files
// and reading the palette out of them.
//
//   node scripts/resolve-themes.ts [--offline] [--update-lock] [--only <id>]
//
// Files are fetched from raw.githubusercontent.com at the pinned commit into
// themes/.cache/<repo>/<rev>/<path> (gitignored) and checked against
// themes/lock.json, which records a SHA-256 per file. --update-lock records
// hashes for new or re-pinned pointers; --offline never touches the network
// (the Nix build pre-populates the cache from the lock).
//
// Runs under plain Node 24 (type stripping): keep this file and everything it
// imports free of TypeScript-only runtime syntax.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import {
  alistToMapping,
  alistToPalette,
  dedupe,
  evaluatePalettes,
  extractTheme,
  type ExtractedTheme,
  type Externals,
  type PaletteAlist,
  type SourceFile,
} from "../src/theme/elisp/extract.ts";
import {
  registerCore,
  toThemeDoc,
  validateThemeFile,
  type Collection,
  type FullThemeFile,
  type PartialThemeFile,
  type ResolvedThemeFile,
  type SourceThemeFile,
  type ThemeFileMeta,
  type ThemeProvenance,
} from "../src/theme/theme-file.ts";
import { COLLECTION_DIRS } from "../src/theme/theme-files-node.ts";
import type { ThemeDoc } from "../src/theme/types.ts";

const ROOT = resolve(import.meta.dirname, "..");
const THEMES = join(ROOT, "themes");
const CACHE = join(THEMES, ".cache");
const OUT = join(THEMES, "resolved");
const LOCK_PATH = join(THEMES, "lock.json");

const args = process.argv.slice(2);
const offline = args.includes("--offline");
const updateLock = args.includes("--update-lock");
const onlyIndex = args.indexOf("--only");
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : null;

const CORE_SYMBOLS = [
  "operandi",
  "operandi-tinted",
  "operandi-deuteranopia",
  "operandi-tritanopia",
  "vivendi",
  "vivendi-tinted",
  "vivendi-deuteranopia",
  "vivendi-tritanopia",
].map((n) => `modus-themes-${n}-palette`);
const ENGINE_REPO = "protesilaos/modus-themes";

type Lock = Record<string, { repo: string; rev: string; files: Record<string, string> }>;

interface Pointer {
  path: string;
  collection: Collection;
  file: SourceThemeFile;
}

function readPointers(): Pointer[] {
  const out: Pointer[] = [];
  for (const dir of COLLECTION_DIRS) {
    const full = join(THEMES, dir);
    if (!existsSync(full)) continue;
    for (const name of readdirSync(full).sort()) {
      if (!name.endsWith(".json")) continue;
      const path = join(full, name);
      const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
      if ((parsed as { kind?: string }).kind !== "source") continue;
      const issues = validateThemeFile(parsed, name.replace(/\.json$/, ""));
      if (issues.length > 0) {
        fail(`${rel(path)}:\n${issues.map((i) => `  - ${i.message}`).join("\n")}`);
        continue;
      }
      out.push({ path, collection: dir, file: parsed as SourceThemeFile });
    }
  }
  return out;
}

function rel(path: string): string {
  return path.startsWith(ROOT) ? path.slice(ROOT.length + 1) : path;
}

let failures = 0;
function fail(message: string): void {
  failures++;
  console.error(`error: ${message}`);
}

function sri(text: string): string {
  return `sha256-${createHash("sha256").update(text).digest("base64")}`;
}

async function fetchFile(repo: string, rev: string, path: string): Promise<string> {
  const cached = join(CACHE, repo, rev, path);
  if (existsSync(cached)) return readFileSync(cached, "utf8");
  if (offline)
    throw new Error(`${repo}@${rev.slice(0, 7)}:${path} is not in themes/.cache (offline)`);
  const url = `https://raw.githubusercontent.com/${repo}/${rev}/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const text = await res.text();
  mkdirSync(dirname(cached), { recursive: true });
  writeFileSync(cached, text);
  return text;
}

async function sourceFiles(pointer: Pointer, lock: Lock): Promise<SourceFile[]> {
  const { repo, rev, files } = pointer.file.source;
  const id = pointer.file.id;
  const entry = lock[id];
  const out: SourceFile[] = [];
  const hashes: Record<string, string> = {};
  for (const path of files) {
    const text = await fetchFile(repo, rev, path);
    hashes[path] = sri(text);
    out.push({ path, text });
  }
  if (entry && entry.rev === rev && entry.repo === repo) {
    for (const path of files) {
      if (entry.files[path] !== hashes[path]) {
        throw new Error(
          `${repo}@${rev.slice(0, 7)}:${path} does not match themes/lock.json (expected ${entry.files[path]}, got ${hashes[path]})`,
        );
      }
    }
  } else if (updateLock) {
    lock[id] = { repo, rev, files: hashes };
  } else {
    throw new Error(
      `${id} is not pinned in themes/lock.json at ${rev.slice(0, 7)}; run with --update-lock`,
    );
  }
  return out;
}

function titleCase(name: string): string {
  return name
    .split("-")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function labelFor(theme: ExtractedTheme, override?: string): string {
  if (override) return override;
  const base = titleCase(theme.name);
  return /\b(light|dark)\b/i.test(base) ? base : `${base} (${theme.mode})`;
}

function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const m = /^(.*?[.!?])(\s|$)/.exec(flat);
  return (m ? m[1]! : flat).trim();
}

function metaFor(pointer: Pointer, theme: ExtractedTheme): ThemeFileMeta {
  const o = pointer.file.meta ?? {};
  const description =
    o.description ??
    (theme.description ? firstSentence(theme.description) : undefined) ??
    theme.header.summary ??
    labelFor(theme, o.label);
  return {
    name: theme.name,
    label: labelFor(theme, o.label),
    description,
    mode: theme.mode,
    author: o.author ?? theme.header.author,
    homepage: o.homepage ?? theme.header.url ?? `https://github.com/${pointer.file.source.repo}`,
    license: o.license ?? theme.header.license,
    tags: o.tags,
  };
}

function provenanceFor(pointer: Pointer, theme: ExtractedTheme): ThemeProvenance {
  const { repo, rev, files, theme: symbol } = pointer.file.source;
  return {
    repo,
    rev,
    files,
    theme: symbol,
    url: `https://github.com/${repo}/blob/${rev}/${theme.file}`,
    api: theme.api,
    customFaces: theme.customFacesCount,
    install: pointer.file.install,
  };
}

function coreSymbolFor(theme: ExtractedTheme, pointer: Pointer): string | undefined {
  if (pointer.file.source.repo !== ENGINE_REPO) return undefined;
  const symbol = `modus-themes-${theme.name.replace(/^modus-/, "")}-palette`;
  return CORE_SYMBOLS.includes(symbol) ? symbol : undefined;
}

function fullFile(pointer: Pointer, theme: ExtractedTheme, effective: PaletteAlist): FullThemeFile {
  return {
    kind: "full",
    id: pointer.file.id,
    meta: metaFor(pointer, theme),
    palette: alistToPalette(effective),
    mappings: alistToMapping(effective),
    collection: pointer.collection,
    coreSymbol: coreSymbolFor(theme, pointer),
    source: provenanceFor(pointer, theme),
  };
}

function partialFile(pointer: Pointer, theme: ExtractedTheme): PartialThemeFile | null {
  const g = theme.generated;
  if (!g) return null;
  const file: PartialThemeFile = {
    kind: "partial",
    id: pointer.file.id,
    meta: metaFor(pointer, theme),
    base: alistToPalette(g.base),
    mappings: alistToMapping(g.mappings),
    collection: pointer.collection,
    source: provenanceFor(pointer, theme),
  };
  if (g.preference) file.preference = g.preference;
  file.core = g.coreSymbol ?? g.defaultCoreSymbol ?? undefined;
  return file;
}

/** True when expanding `partial` in the app reproduces Emacs's effective palette exactly. */
function partialIsExact(partial: PartialThemeFile, effective: PaletteAlist): boolean {
  let doc: ThemeDoc;
  try {
    doc = toThemeDoc(partial);
  } catch {
    return false;
  }
  const want = new Map(effective.map((e) => [e.key, e.value]));
  const got = new Map<string, string>([
    ...Object.entries(doc.palette),
    ...Object.entries(doc.mappings),
  ] as [string, string][]);
  if (want.size !== got.size) return false;
  for (const [k, v] of want) if (got.get(k) !== v) return false;
  return true;
}

function writeResolved(file: ResolvedThemeFile): void {
  const issues = validateThemeFile(file, file.id).filter((i) => !i.message.startsWith("warning:"));
  if (issues.length > 0) {
    fail(`resolved ${file.id} is invalid:\n${issues.map((i) => `  - ${i.message}`).join("\n")}`);
    return;
  }
  writeFileSync(join(OUT, `${file.id}.json`), `${JSON.stringify(file, null, 2)}\n`);
}

async function main(): Promise<void> {
  const lock: Lock = existsSync(LOCK_PATH) ? JSON.parse(readFileSync(LOCK_PATH, "utf8")) : {};
  const pointers = readPointers();
  const selected = (p: Pointer) => !only || p.file.id === only;
  if (!only) {
    rmSync(OUT, { recursive: true, force: true });
  }
  mkdirSync(OUT, { recursive: true });

  // The engine's own core palettes come first: every other theme fills from
  // them, and Modus pointers list modus-themes.el itself. They are read even
  // under --only, since the selected theme needs them as externals.
  const enginePointers = pointers.filter((p) => p.file.source.repo === ENGINE_REPO);
  const others = pointers.filter((p) => p.file.source.repo !== ENGINE_REPO && selected(p));
  let externals: Externals = new Map();

  const engineFiles = new Map<string, SourceFile[]>();
  for (const pointer of enginePointers) {
    try {
      engineFiles.set(pointer.file.id, await sourceFiles(pointer, lock));
    } catch (e) {
      fail(`${pointer.file.id}: ${(e as Error).message}`);
    }
  }
  const engineMain = [...engineFiles.values()]
    .flat()
    .find((f) => f.path === "modus-themes.el" || f.path.endsWith("/modus-themes.el"));
  if (engineMain) {
    externals = evaluatePalettes([engineMain], CORE_SYMBOLS);
    for (const [symbol, alist] of externals) {
      registerCore(symbol, {
        meta: {
          name: symbol,
          description: symbol,
          mode: symbol.includes("vivendi") ? "dark" : "light",
        },
        palette: alistToPalette(alist),
        mappings: alistToMapping(alist),
      });
    }
  } else if (others.length > 0) {
    fail("no Modus pointer lists modus-themes.el, so no core palettes are available");
  }

  let resolvedCount = 0;
  const resolveOne = async (pointer: Pointer, files?: SourceFile[]) => {
    const id = pointer.file.id;
    try {
      const sources = files ?? (await sourceFiles(pointer, lock));
      const theme = extractTheme(sources, pointer.file.source.theme, externals);
      const effective = dedupe(theme.effective);
      const partial = partialFile(pointer, theme);
      const file =
        partial && partialIsExact(partial, effective)
          ? partial
          : fullFile(pointer, theme, effective);
      writeResolved(file);
      resolvedCount++;
      console.info(
        `${id.padEnd(28)} ${file.kind.padEnd(7)} ${theme.api} ${theme.mode.padEnd(5)} ${pointer.file.source.repo}@${pointer.file.source.rev.slice(0, 7)}`,
      );
    } catch (e) {
      fail(`${id}: ${(e as Error).message}`);
    }
  };

  for (const pointer of enginePointers) {
    const files = engineFiles.get(pointer.file.id);
    if (files && selected(pointer)) await resolveOne(pointer, files);
  }
  for (const pointer of others) await resolveOne(pointer);

  if (updateLock) {
    const known = new Set(pointers.map((p) => p.file.id));
    const sorted: Lock = {};
    for (const key of Object.keys(lock).sort()) if (known.has(key)) sorted[key] = lock[key]!;
    writeFileSync(LOCK_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
  }
  const wanted = pointers.filter(selected).length;
  console.info(`resolved ${resolvedCount} of ${wanted} pointer themes into ${rel(OUT)}`);
  if (failures > 0) {
    console.error(`${failures} failed`);
    process.exit(1);
  }
}

await main();
