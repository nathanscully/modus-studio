// Fidelity: for every fixture theme, the extractor's effective palette must
// equal what Emacs 31 computes when it loads the same pinned files. The
// ground truth under __fixtures__/emacs-31 was produced by
// scratch/dump-palette.sh (Emacs 31.1 with the pinned modus-themes.el) and is
// the raw (append overrides user core) alist; first entry per key wins.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  evaluatePalettes,
  ExtractError,
  extractTheme,
  parseHeader,
  type SourceFile,
} from "./extract.ts";

const FIXTURES = join(import.meta.dirname, "__fixtures__");
const MODUS = "protesilaos__modus-themes@f1ad6c9";
const EF = "protesilaos__ef-themes@e1f6176";

function files(dir: string, names: readonly string[]): SourceFile[] {
  return names.map((n) => ({
    path: `${dir}/${n}`,
    text: readFileSync(join(FIXTURES, dir, n), "utf8"),
  }));
}

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

const externals = evaluatePalettes(files(MODUS, ["modus-themes.el"]), CORE_SYMBOLS);

function emacsPalette(theme: string): Map<string, string> | null {
  const path = join(FIXTURES, "emacs-31", `${theme}.txt`);
  if (!existsSync(path)) return null;
  const out = new Map<string, string>();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const [key, value] = line.split(" ");
    if (key && value && !out.has(key)) out.set(key, value);
  }
  return out;
}

interface Spec {
  dir: string;
  files: string[];
  theme: string;
  api: "modus-5" | "modus-4";
  shape: "full" | "partial";
}

const SPECS: Spec[] = [
  {
    dir: MODUS,
    files: ["modus-themes.el", "modus-operandi-theme.el"],
    theme: "modus-operandi",
    api: "modus-5",
    shape: "full",
  },
  {
    dir: MODUS,
    files: ["modus-themes.el", "modus-vivendi-tinted-theme.el"],
    theme: "modus-vivendi-tinted",
    api: "modus-5",
    shape: "full",
  },
  {
    dir: EF,
    files: ["ef-themes.el", "ef-summer-theme.el"],
    theme: "ef-summer",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: EF,
    files: ["ef-themes.el", "ef-night-theme.el"],
    theme: "ef-night",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: "paniash__modus-vague@a3b9475",
    files: ["modus-vague-theme.el"],
    theme: "modus-vague",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: "kiennq__modus-zenburn@4043b09",
    files: ["modus-zenburn.el", "modus-zenburn-theme.el"],
    theme: "modus-zenburn",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: "kiennq__modus-zenburn@4043b09",
    files: ["modus-zenburn.el", "modus-zenburn-light-theme.el"],
    theme: "modus-zenburn-light",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: "dpassen__modus-flexoki@30fe4c6",
    files: ["modus-flexoki.el", "modus-flexoki-light-theme.el"],
    theme: "modus-flexoki-light",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: "dpassen__modus-flexoki@30fe4c6",
    files: ["modus-flexoki.el", "modus-flexoki-dark-theme.el"],
    theme: "modus-flexoki-dark",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: "emacsmirror__peppers-theme@8a8dd53",
    files: ["peppers-theme.el"],
    theme: "peppers",
    api: "modus-5",
    shape: "full",
  },
  {
    dir: "benleis1__nano-like-modus-theme@2b81d57",
    files: ["nano-like-modus-theme.el"],
    theme: "nano-like-modus",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: "dalugm__jinlor.el@addbfb0",
    files: ["jinlor.el", "jinlor-elysia-theme.el"],
    theme: "jinlor-elysia",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: "splintersuidman__flexoki-themes@9875c59",
    files: ["flexoki-themes.el", "flexoki-dark-theme.el"],
    theme: "flexoki-dark",
    api: "modus-5",
    shape: "full",
  },
  {
    dir: "Artawower__modern-themes@86e86e6",
    files: ["modern-themes.el", "modern-ayu-dark-theme.el"],
    theme: "modern-ayu-dark",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: "Artawower__modern-themes@86e86e6",
    files: ["modern-themes.el", "modern-catppuccin-mocha-theme.el"],
    theme: "modern-catppuccin-mocha",
    api: "modus-5",
    shape: "partial",
  },
  {
    dir: "andiogenes__bogus-themes@f4c68b7",
    files: ["bogus-operandi-theme.el"],
    theme: "bogus-operandi",
    api: "modus-4",
    shape: "full",
  },
];

describe("evaluatePalettes", () => {
  it("evaluates the eight Modus cores from modus-themes.el", () => {
    for (const sym of CORE_SYMBOLS) {
      const alist = externals.get(sym);
      expect(alist, sym).toBeDefined();
      expect(alist!.length).toBeGreaterThan(300);
      expect(alist!.find((e) => e.key === "bg-main")?.value).toMatch(/^#[0-9a-f]{6}$/);
      expect(alist!.find((e) => e.key === "keyword")?.isSymbol).toBe(true);
    }
  });
});

describe("extractTheme", () => {
  describe.each(SPECS)("$theme", (spec) => {
    const theme = extractTheme(files(spec.dir, spec.files), spec.theme, externals);

    it(`uses the ${spec.api} API and is ${spec.shape}`, () => {
      expect(theme.api).toBe(spec.api);
      expect(theme.generated != null).toBe(spec.shape === "partial");
      expect(theme.mode).toMatch(/^(light|dark)$/);
    });

    it("matches the palette Emacs 31 computes, key for key", () => {
      const emacs = emacsPalette(spec.theme);
      if (!emacs) return;
      const ours = new Map(theme.effective.map((e) => [e.key, e.value]));
      const diffs: string[] = [];
      for (const [key, value] of emacs) {
        if (ours.get(key) !== value)
          diffs.push(`${key}: emacs=${value} ours=${ours.get(key) ?? "missing"}`);
      }
      for (const key of ours.keys()) if (!emacs.has(key)) diffs.push(`${key}: not in Emacs`);
      expect(diffs).toEqual([]);
    });
  });

  it("reads the header credit lines", () => {
    const theme = extractTheme(
      files("paniash__modus-vague@a3b9475", ["modus-vague-theme.el"]),
      "modus-vague",
      externals,
    );
    expect(theme.header.author).toBe("Ashish Panigrahi");
    expect(theme.header.url).toMatch(/github\.com\/paniash\/modus-vague/);
    expect(theme.customFacesCount).toBe(1);
  });

  it("captures the generate-palette inputs of a partial theme", () => {
    const theme = extractTheme(
      files("kiennq__modus-zenburn@4043b09", ["modus-zenburn.el", "modus-zenburn-theme.el"]),
      "modus-zenburn",
      externals,
    );
    expect(theme.generated?.coreSymbol).toBe("modus-themes-vivendi-tinted-palette");
    expect(theme.generated?.base.find((e) => e.key === "bg-main")?.value).toBe("#3F3F3F");
    expect(theme.generated?.mappings.length).toBeGreaterThan(0);
  });

  it("names the missing theme when the call is absent", () => {
    expect(() =>
      extractTheme(
        files("paniash__modus-vague@a3b9475", ["modus-vague-theme.el"]),
        "nope",
        externals,
      ),
    ).toThrow(/no \(modus-themes-theme \.\.\.\) call for "nope"; found modus-vague/);
  });

  it("reports the file and line of an unsupported form", () => {
    const src: SourceFile = {
      path: "weird-theme.el",
      text: `(defconst weird-palette (mapcar #'identity '((bg-main "#000000"))))\n(modus-themes-theme 'weird 'weird "w" 'dark 'weird-palette nil nil)`,
    };
    expect(() => extractTheme([src], "weird")).toThrow(ExtractError);
    expect(() => extractTheme([src], "weird")).toThrow(
      /weird-theme\.el:1: unsupported form \(mapcar/,
    );
  });

  it("parses a package header", () => {
    const header = parseHeader(
      `;;; foo-theme.el --- Foo for Emacs -*- lexical-binding: t -*-\n\n;; Author: Ada <ada@example.org>\n;; URL: https://example.org/foo\n;; SPDX-License-Identifier: MIT\n;; Version: 1.2.3\n`,
    );
    expect(header).toEqual({
      summary: "Foo for Emacs",
      author: "Ada",
      url: "https://example.org/foo",
      license: "MIT",
      version: "1.2.3",
    });
  });
});
