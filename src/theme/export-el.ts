// Emit Emacs Lisp from a ThemeDoc:
//   - exportThemeFile: a self-contained derivative theme file built on modus-themes,
//     loadable under both modus-themes APIs (see exportThemeFile).
//   - exportOverrides: a (setq <base>-palette-overrides '(...)) snippet containing
//     only the entries that differ from the chosen base preset.

import { REPO_URL } from "../lib/site.ts";
import { COLOR_GROUPS, ROLE_GROUPS, type ColorKey } from "./palette-keys.ts";
import { isHex, UNSPECIFIED } from "./resolve.ts";
import { getModusCore } from "./theme-file.ts";
import type { MappingValue, Palette, ThemeDoc } from "./types.ts";

/**
 * The modus-themes face specs reference the full set of named colors directly
 * (e.g. `modeline-err`, `bg-char-0`, the terminal colors). A preset ported from
 * a leaner palette (such as the ef-themes) may omit some, which would raise a
 * `void-variable` at load time. Backfill any missing named color from the
 * matching Modus base so every exported theme is self-contained and loadable.
 */
function completePalette(doc: ThemeDoc): Palette {
  const base = getModusCore(doc.meta.mode).palette;
  return { ...base, ...doc.palette };
}

const WAVE_UNDERLINE_ROLES: ReadonlySet<string> = new Set([
  "underline-err",
  "underline-warning",
  "underline-note",
]);

/**
 * A mapping value is emitted as a bare elisp SYMBOL unless it is a literal hex
 * color (which must be a quoted string). Both palette-color names and other
 * semantic-role names (e.g. `accent-0`, `rainbow-0` — the modus engine chains
 * through these) are symbols, so only a `#hex` value gets quotes.
 */
function formatValue(value: MappingValue): string {
  if (value === UNSPECIFIED) return "unspecified";
  if (isHex(value)) return `"${value}"`; // raw hex string -> quoted
  return value; // a color-name or role-name symbol -> bare
}

function entry(key: string, value: string): string {
  // Pad the key column so the alist lines up, mirroring upstream formatting.
  return `    (${key.padEnd(26)} ${value})`;
}

/** Build the `(...)` body of the palette alist: layer-1 colors then layer-2 mappings. */
function paletteBody(doc: ThemeDoc): string {
  const lines: string[] = [];
  const palette = completePalette(doc);

  for (const group of COLOR_GROUPS) {
    const present = group.keys.filter((k): k is ColorKey => palette[k] != null);
    if (present.length === 0) continue;
    lines.push(`;;; ${group.title}`);
    for (const k of present) lines.push(entry(k, `"${palette[k]!}"`));
    lines.push("");
  }

  lines.push(";;;; Semantic mappings");
  // Emit EVERY mapping key so the modus-themes face specs (which reference the
  // full set of mapping symbols) never hit a `void-variable` at load time.
  //
  // Resolution order per key:
  //   1. an explicit mapping in the doc -> use it
  //   2. else, if the doc's PALETTE defines this name as a color (some themes,
  //      e.g. the ef-themes, define `cursor` as a named color) -> emit that hex,
  //      so the symbol is still bound
  //   3. else, for the wave-underline roles -> the modus core's mapping (the
  //      engine puts these inside `(:underline (:style wave :color VALUE))`,
  //      and graphical frames reject `unspecified` as a color there — upstream
  //      ef themes omit them, so without this backfill the export fails
  //      load-theme on X11/cairo builds)
  //   4. else -> `unspecified`
  const coreMappings = getModusCore(doc.meta.mode).mappings;
  for (const group of ROLE_GROUPS) {
    lines.push(`;;; ${group.title}`);
    for (const k of group.keys) {
      const mapped = doc.mappings[k];
      const paletteColor = palette[k as ColorKey];
      const coreFallback = WAVE_UNDERLINE_ROLES.has(k) ? coreMappings[k] : undefined;
      const value = mapped ?? paletteColor ?? coreFallback ?? UNSPECIFIED;
      lines.push(entry(k, formatValue(value)));
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/** Escape a string for an elisp string literal. */
function elispString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** The `;; Key: value` credit lines for the file header, from the doc's provenance. */
function creditHeader(doc: ThemeDoc): string {
  const { author, homepage, license } = doc.meta;
  const lines: string[] = [];
  if (author) lines.push(`;; Author: ${author}`);
  if (homepage) lines.push(`;; URL: ${homepage}`);
  if (license) lines.push(`;; SPDX-License-Identifier: ${license}`);
  return lines.length > 0 ? `${lines.join("\n")}\n\n` : "";
}

/**
 * Emit a theme file that loads under both modus-themes APIs:
 *
 *   - modus-themes 4 (bundled with Emacs 30): `modus-themes-theme` is a 3-argument
 *     MACRO taking bare symbols — (NAME PALETTE OVERRIDES) — and the theme file
 *     declares the theme itself with `deftheme` and `provide-theme`.
 *   - modus-themes 5 (bundled with Emacs 31, and on GNU ELPA): `modus-themes-theme`
 *     is a 7-argument FUNCTION taking quoted symbols — (NAME FAMILY DESCRIPTION
 *     BACKGROUND-MODE CORE-PALETTE USER-PALETTE OVERRIDES-PALETTE) — that declares,
 *     registers and provides the theme on its own. The full palette is passed as
 *     the core palette, the way the ef-themes do it, plus an empty
 *     `NAME-palette-user` defcustom mirroring the bundled Modus theme files.
 *
 * `(macrop 'modus-themes-theme)` picks the branch at load time. The whole body
 * sits inside `eval-and-compile` so that, under the macro API, the palette
 * `defconst` is evaluated before the macro expands (it reads the palette's value
 * at expansion time).
 */
export function exportThemeFile(doc: ThemeDoc): string {
  const { name, description, mode } = doc.meta;
  const desc = elispString(description);

  const palette = paletteBody(doc)
    .split("\n")
    .map((l) => (l ? `    ${l}` : l))
    .join("\n");

  return `;;; ${name}-theme.el --- ${description} -*- lexical-binding:t -*-

${creditHeader(doc)};; Made with modus-studio (${REPO_URL}), built on top of the
;; modus-themes by Protesilaos Stavrou. Requires the \`modus-themes' package:
;; the copy bundled with Emacs >= 30, or the one on GNU ELPA.

;;; Code:

(eval-and-compile
  (unless (require 'modus-themes nil t)
    (require-theme 'modus-themes))

  (defconst ${name}-palette
    '(
${palette}
)
    "The entire palette of the \`${name}' theme.

Named colors have the form (COLOR-NAME HEX-VALUE) with the former
as a symbol and the latter as a string.

Semantic color mappings have the form (MAPPING-NAME COLOR-NAME)
with both as symbols.  The latter is a named color that already
exists in the palette and is associated with a HEX-VALUE.")

  (defcustom ${name}-palette-user nil
    "Like the \`${name}-palette' for user-defined entries.
This is meant to extend the palette with custom named colors and/or
semantic palette mappings.  Those may then be used in combination with
palette overrides (also see \`modus-themes-common-palette-overrides' and
\`${name}-palette-overrides')."
    :group 'modus-themes
    :type '(repeat (list symbol (choice symbol string))))

  (defcustom ${name}-palette-overrides nil
    "Overrides for \`${name}-palette'.

Mirror the elements of the aforementioned palette, overriding
their value.  Theme-specific overrides take precedence over the
shared \`modus-themes-common-palette-overrides'."
    :group 'modus-themes
    :type '(repeat (list symbol (choice symbol string))))

  (if (macrop 'modus-themes-theme)
      ;; modus-themes 4 (Emacs 30): a macro over bare symbols; the theme file
      ;; declares and provides the theme itself.
      (progn
        (deftheme ${name}
          ${desc}
          :background-mode '${mode}
          :kind 'color-scheme
          :family '${name})
        (modus-themes-theme ${name}
                            ${name}-palette
                            ${name}-palette-overrides)
        (provide-theme '${name}))
    ;; modus-themes 5 (Emacs 31, GNU ELPA): a function over quoted symbols that
    ;; declares, registers and provides the theme on its own.
    (modus-themes-theme
     '${name}
     '${name}
     ${desc}
     '${mode}
     '${name}-palette
     '${name}-palette-user
     '${name}-palette-overrides)))

;;; ${name}-theme.el ends here
`;
}

/**
 * Emit a palette-overrides setq snippet containing only entries that differ
 * from `base`. Compares both layer-1 colors and layer-2 mappings.
 */
export function exportOverrides(doc: ThemeDoc, base: ThemeDoc, baseId: string): string {
  const lines: string[] = [];

  for (const group of COLOR_GROUPS) {
    for (const k of group.keys) {
      const cur = doc.palette[k];
      if (cur != null && cur !== base.palette[k]) {
        lines.push(entry(k, `"${cur}"`));
      }
    }
  }
  for (const group of ROLE_GROUPS) {
    for (const k of group.keys) {
      const cur = doc.mappings[k];
      if (cur != null && cur !== base.mappings[k]) {
        lines.push(entry(k, formatValue(cur)));
      }
    }
  }

  if (lines.length === 0) {
    return `;; No changes from ${baseId} yet — edit some colors to populate this snippet.`;
  }

  return `(setq ${baseId}-palette-overrides
  '(
${lines.join("\n")}
  ))`;
}
