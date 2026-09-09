// A hand-authored, static token-span snippet used by every gallery card.
//
// PERF: instantiating tree-sitter per card (~45 cards) would be prohibitively
// slow and janky, so the gallery does not parse anything. Instead we author a
// few lines of Emacs Lisp as fixed role-tagged spans once, and each card styles
// them with ITS OWN resolved colors via `--modus-<role>` CSS variables. The role
// vocabulary is the same `RoleKey` the live preview uses, so a card's snippet
// looks exactly like that theme would paint this code.

import type { Span } from "~/theme/highlight/parser.ts";

type Line = readonly Span[];

const S = (text: string, role: Span["role"] = null): Span => ({ text, role });

export const SNIPPET_LINES: readonly Line[] = [
  [S(";; fib.el — a tiny sample", "comment")],
  [S("("), S("defun", "keyword"), S(" "), S("fib", "fnname"), S(" ("), S("n", "variable"), S(")")],
  [
    S("  ("),
    S("if", "keyword"),
    S(" ("),
    S("<", "fnname-call"),
    S(" "),
    S("n", "variable-use"),
    S(" "),
    S("2", "number"),
    S(")"),
  ],
  [S("      "), S("n", "variable-use")],
  [
    S("    ("),
    S("+", "fnname-call"),
    S(" ("),
    S("fib", "fnname-call"),
    S(" ("),
    S("-", "fnname-call"),
    S(" "),
    S("n", "variable-use"),
    S(" "),
    S("1", "number"),
    S("))"),
  ],
  [
    S("       ("),
    S("fib", "fnname-call"),
    S(" ("),
    S("-", "fnname-call"),
    S(" "),
    S("n", "variable-use"),
    S(" "),
    S("2", "number"),
    S(")))))"),
  ],
  [
    S("("),
    S("message", "fnname-call"),
    S(" "),
    S('"fib 10 = %d"', "string"),
    S(" ("),
    S("fib", "fnname-call"),
    S(" "),
    S("10", "number"),
    S("))"),
  ],
];
