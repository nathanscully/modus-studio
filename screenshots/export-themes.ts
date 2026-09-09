// Export every theme under themes/**/*.json as a self-contained .el file, plus
// the sample.el buffer the app preview renders — the input set for the nix
// themeScreenshots derivation (see nix/screenshots.nix).
//
// Runs under plain Node 24 (type stripping is on by default): the theme engine
// is dependency-free TypeScript, and this script loads theme files with fs
// instead of the Vite-only loader (import.meta.glob).
//
//   node screenshots/export-themes.ts <themes-dir> <out-dir>

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { exportThemeFile } from "../src/theme/export-el.ts";
import { ELISP_SAMPLE, TS_SAMPLE } from "../src/theme/highlight/languages.ts";
import {
  registerModusCores,
  toThemeDoc,
  validateThemeFile,
  type ThemeFile,
} from "../src/theme/theme-file.ts";

const [themesDir, outDir] = process.argv.slice(2);
if (!themesDir || !outDir) {
  console.error("usage: node screenshots/export-themes.ts <themes-dir> <out-dir>");
  process.exit(1);
}

function validated(path: string, parsed: unknown): ThemeFile {
  const stem = path.slice(path.lastIndexOf("/") + 1).replace(/\.json$/, "");
  const errors = validateThemeFile(parsed, stem).filter((i) => !i.message.startsWith("warning:"));
  if (errors.length > 0) {
    throw new Error(
      `invalid theme file ${path}:\n${errors.map((i) => `  - ${i.message}`).join("\n")}`,
    );
  }
  return parsed as ThemeFile;
}

const paths = readdirSync(themesDir, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith(".json"))
  .map((e) => join(e.parentPath, e.name))
  .sort();

const parsedByPath = paths.map(
  (path) => [path, JSON.parse(readFileSync(path, "utf8")) as unknown] as const,
);

// The modus cores must be registered before any partial can validate or expand.
const core = (id: string): ThemeFile => {
  const hit = parsedByPath.find(([path]) => path.endsWith(`/${id}.json`));
  if (!hit) throw new Error(`modus core theme file ${id}.json not found`);
  return validated(hit[0], hit[1]);
};
registerModusCores(toThemeDoc(core("modus-operandi")), toThemeDoc(core("modus-vivendi")));

const files = parsedByPath.map(([path, parsed]) => validated(path, parsed));

mkdirSync(outDir, { recursive: true });
for (const file of files) {
  const doc = toThemeDoc(file);
  writeFileSync(join(outDir, `${file.id}-theme.el`), exportThemeFile(doc));
}
writeFileSync(join(outDir, "sample.el"), ELISP_SAMPLE);
writeFileSync(join(outDir, "sample.ts"), TS_SAMPLE);
console.log(`exported ${files.length} themes + samples to ${outDir}`);
