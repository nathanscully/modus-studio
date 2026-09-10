// Map tree-sitter highlight capture names onto Modus semantic roles.
//
// This mirrors how Emacs's own *-ts-mode highlighting works: tree-sitter
// captures (e.g. @keyword, @function, @string) are assigned faces. Here each
// capture resolves to a Modus RoleKey, which the preview then resolves to a hex
// via the current ThemeDoc. The most specific capture wins (see longest-prefix
// lookup below); unmapped captures fall back to fg-main.

import type { RoleKey } from "../palette-keys.ts";

// An array of [capture, role] pairs (not a plain object) so well-known property
// names like "constructor" can be used as keys without prototype hazards.
// Dotted captures (e.g. "function.call") are matched by longest dotted-prefix,
// so "function.call" falls back to "function" if not listed explicitly.
const CAPTURE_TABLE: ReadonlyArray<readonly [string, RoleKey]> = [
  ["keyword", "keyword"],
  ["keyword.function", "keyword"],
  ["keyword.operator", "keyword"],
  ["keyword.return", "keyword"],
  ["keyword.conditional", "keyword"],
  ["keyword.repeat", "keyword"],
  ["keyword.import", "keyword"],

  ["comment", "comment"],
  ["comment.documentation", "docstring"],

  ["string", "string"],
  ["string.documentation", "docstring"],
  ["string.escape", "rx-backslash"],
  ["escape", "rx-backslash"],
  ["embedded", "variable-use"],
  ["string.regexp", "string"],
  ["string.special", "string"],

  ["number", "number"],
  ["number.float", "number"],
  ["boolean", "constant"],
  ["constant", "constant"],
  ["constant.builtin", "builtin"],

  ["function", "fnname"],
  ["function.call", "fnname-call"],
  ["function.builtin", "builtin"],
  ["function.method", "fnname"],
  ["function.method.call", "fnname-call"],
  ["function.macro", "fnname"],

  ["type", "type"],
  ["type.builtin", "type"],
  ["constructor", "type"],

  ["variable", "variable"],
  ["variable.builtin", "builtin"],
  ["variable.parameter", "variable-use"],
  ["variable.member", "property"],
  ["property", "property"],
  ["field", "property"],

  ["operator", "operator"],
  ["punctuation", "punctuation"],
  ["punctuation.delimiter", "delimiter"],
  ["punctuation.bracket", "bracket"],
  ["punctuation.special", "punctuation"],

  ["attribute", "preprocessor"],
  ["keyword.directive", "preprocessor"],
  ["preproc", "preprocessor"],

  ["label", "name"],
  ["tag", "name"],
];

const CAPTURE_TO_ROLE = new Map<string, RoleKey>(CAPTURE_TABLE);

/**
 * Resolve a capture name to a Modus role, trying the full name then successively
 * shorter dotted prefixes (e.g. "function.method.call" -> "function.method" ->
 * "function"). Returns null when nothing matches (caller falls back to fg-main).
 */
export function captureToRole(capture: string): RoleKey | null {
  let name = capture;
  for (;;) {
    const role = CAPTURE_TO_ROLE.get(name);
    if (role) return role;
    const dot = name.lastIndexOf(".");
    if (dot === -1) return null;
    name = name.slice(0, dot);
  }
}
