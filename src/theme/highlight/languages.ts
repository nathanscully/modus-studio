// Registry of sample languages for the preview buffer.
//
// Each entry pairs a tree-sitter grammar (vendored under public/grammars/, built
// from source with the matching tree-sitter CLI so the ABI matches
// web-tree-sitter) with its official highlights query (also vendored as a .scm
// file, fetched at runtime) and a sample source string. The capture names the
// queries produce are mapped to Modus roles in capture-to-role.ts.
//
// Grammar + query provenance (built with tree-sitter CLI 0.26, ABI 15):
//   elisp:      tree-sitter-elisp@1.6.1
//   typescript: tree-sitter-typescript@0.23.2 (highlights = JS base + TS overrides)

import type { LanguageId } from "../../state/theme-store.tsx";

export interface LanguageDef {
  id: LanguageId;
  label: string;
  /** Path under /public to the grammar wasm. */
  wasmPath: string;
  /** Path under /public to the highlights query (.scm). */
  queryPath: string;
  sample: string;
}

const ELISP_SAMPLE = `;;; sample.el --- a small Emacs Lisp buffer  -*- lexical-binding: t; -*-

(require 'cl-lib)

(defconst my-greeting "Hello, Modus!"
  "A friendly docstring constant.")

(defun my/fib (n)
  "Return the Nth Fibonacci number."
  (if (< n 2)
      n
    (+ (my/fib (- n 1))
       (my/fib (- n 2)))))

(defvar my-count 0
  "A mutable counter.")

(let ((total 0))
  (dolist (x '(1 2 3 5 8))
    (setq total (+ total x)))
  (message "%s sum=%d" my-greeting total))

(provide 'sample)
;;; sample.el ends here
`;

const TS_SAMPLE = `// sample.ts — a small TypeScript buffer

import { useState } from "react";

interface Point {
  x: number;
  y: number;
}

const ORIGIN: Point = { x: 0, y: 0 };

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

class Counter {
  private count = 0;

  increment(by = 1): void {
    this.count += by;
  }

  get value(): number {
    return this.count;
  }
}

const greeting = \`distance is \${distance(ORIGIN, { x: 3, y: 4 })}\`;
console.log(greeting);
`;

export const LANGUAGES: Record<LanguageId, LanguageDef> = {
  elisp: {
    id: "elisp",
    label: "Emacs Lisp",
    wasmPath: "/grammars/tree-sitter-elisp.wasm",
    queryPath: "/grammars/elisp-highlights.scm",
    sample: ELISP_SAMPLE,
  },
  typescript: {
    id: "typescript",
    label: "TypeScript",
    wasmPath: "/grammars/tree-sitter-typescript.wasm",
    queryPath: "/grammars/typescript-highlights.scm",
    sample: TS_SAMPLE,
  },
};

export const RUNTIME_WASM_PATH = "/grammars/web-tree-sitter.wasm";
