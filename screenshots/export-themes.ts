// Export every loadable theme as a self-contained .el file, plus the sample
// buffers the app preview renders — the input set for the nix themeScreenshots
// derivation (see nix/screenshots.nix).
//
// Runs under plain Node 24 (type stripping is on by default): the theme engine
// is dependency-free TypeScript, and this script loads theme files with fs
// (theme-files-node.ts) instead of the Vite-only loader. Run
// `node scripts/resolve-themes.ts` first so pointer themes are resolved.
//
//   node screenshots/export-themes.ts <themes-dir> <out-dir>

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { exportThemeFile } from "../src/theme/export-el.ts";
import { ELISP_SAMPLE, TS_SAMPLE } from "../src/theme/highlight/languages.ts";
import { toThemeDoc } from "../src/theme/theme-file.ts";
import { loadThemeFiles } from "../src/theme/theme-files-node.ts";

const [themesDir, outDir] = process.argv.slice(2);
if (!themesDir || !outDir) {
  console.error("usage: node screenshots/export-themes.ts <themes-dir> <out-dir>");
  process.exit(1);
}

const loaded = loadThemeFiles(themesDir);

mkdirSync(outDir, { recursive: true });
for (const { file } of loaded.values()) {
  writeFileSync(join(outDir, `${file.id}-theme.el`), exportThemeFile(toThemeDoc(file)));
}
writeFileSync(join(outDir, "sample.el"), ELISP_SAMPLE);
writeFileSync(join(outDir, "sample.ts"), TS_SAMPLE);
console.log(`exported ${loaded.size} themes + samples to ${outDir}`);
