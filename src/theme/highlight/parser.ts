// Browser-side tree-sitter highlighting via web-tree-sitter (WASM).
//
// Lazily initializes the runtime, loads a grammar + its highlights query, parses
// the sample source, and produces a flat, non-overlapping list of styled spans.
// Each span carries the Modus RoleKey its capture maps to (or null = fg-main).

import { Language, Parser, Query } from "web-tree-sitter";

import type { RoleKey } from "../palette-keys.ts";
import { captureToRole } from "./capture-to-role.ts";
import { LANGUAGES, RUNTIME_WASM_PATH, type LanguageDef } from "./languages.ts";
import type { LanguageId } from "../../state/theme-store.tsx";

export interface Span {
  text: string;
  /** Modus role controlling this span's color, or null to use fg-main. */
  role: RoleKey | null;
}

let initPromise: Promise<void> | null = null;
const langCache = new Map<LanguageId, { language: Language; query: Query }>();

async function ensureInit(): Promise<void> {
  initPromise ??= Parser.init({
    // Only relocate the emscripten runtime asset (web-tree-sitter.wasm /
    // tree-sitter.wasm) to our vendored copy. Grammar wasm paths are passed to
    // Language.load() directly and must NOT be rewritten here, or every grammar
    // would resolve to the runtime binary.
    locateFile: (name: string) =>
      name === "web-tree-sitter.wasm" || name === "tree-sitter.wasm" ? RUNTIME_WASM_PATH : name,
  });
  await initPromise;
}

async function loadLanguage(def: LanguageDef) {
  const cached = langCache.get(def.id);
  if (cached) return cached;
  // Fetch the grammar as bytes and hand Language.load a Uint8Array directly.
  // Passing a path would route through web-tree-sitter's environment detection
  // (`process.versions.node`), which throws under Vite's partial `process` shim;
  // the Uint8Array branch is checked first and avoids that path entirely.
  const [wasmBytes, queryText] = await Promise.all([
    fetch(def.wasmPath).then((r) => r.arrayBuffer()),
    fetch(def.queryPath).then((r) => r.text()),
  ]);
  const language = await Language.load(new Uint8Array(wasmBytes));
  const query = new Query(language, queryText);
  const entry = { language, query };
  langCache.set(def.id, entry);
  return entry;
}

/**
 * Highlight `code` for `languageId`, returning ordered spans that exactly tile
 * the source (gaps between captures become role-less spans). On any failure the
 * whole text is returned as a single role-less span so the preview still renders.
 */
export async function highlight(languageId: LanguageId, code: string): Promise<Span[]> {
  const def = LANGUAGES[languageId];
  try {
    await ensureInit();
    const { language, query } = await loadLanguage(def);

    const parser = new Parser();
    parser.setLanguage(language);
    const tree = parser.parse(code);
    if (!tree) return [{ text: code, role: null }];

    // Collect captures. Later (more specific / innermost) captures should win on
    // overlap; tree-sitter yields captures in document order with inner nodes
    // after their containers for the patterns we use, so a last-writer-wins paint
    // over a per-character role buffer gives the right result.
    const captures = query.captures(tree.rootNode);
    const roles = new Array<RoleKey | null>(code.length).fill(null);

    for (const cap of captures) {
      const role = captureToRole(cap.name);
      if (!role) continue;
      const start = cap.node.startIndex;
      const end = cap.node.endIndex;
      for (let i = start; i < end; i++) roles[i] = role;
    }

    tree.delete();

    // Coalesce consecutive characters with the same role into spans.
    const spans: Span[] = [];
    let i = 0;
    while (i < code.length) {
      const role = roles[i] ?? null;
      let j = i + 1;
      while (j < code.length && (roles[j] ?? null) === role) j++;
      spans.push({ text: code.slice(i, j), role });
      i = j;
    }
    return spans;
  } catch (err) {
    // Highlighting is best-effort: on any failure, render the buffer unstyled.
    console.error(`[highlight] ${languageId} failed:`, err);
    return [{ text: code, role: null }];
  }
}
