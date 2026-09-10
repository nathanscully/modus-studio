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
//   python:     tree-sitter-python@0.25.0
//   rust:       tree-sitter-rust@0.24.0

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

export const ELISP_SAMPLE = `;;; sample.el --- a small Emacs Lisp buffer  -*- lexical-binding: t; -*-

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

export const TS_SAMPLE = `// sample.ts — a small TypeScript buffer

import { useState } from "react";

const NAME = "modus-studio";
const VERSION = "0.1.0";

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

export const PYTHON_SAMPLE = `"""sample.py — a small Python buffer."""

from dataclasses import dataclass
from math import sqrt

NAME = "modus-studio"
VERSION = "0.1.0"


@dataclass
class Point:
    x: float
    y: float


ORIGIN = Point(0.0, 0.0)


def distance(a: Point, b: Point) -> float:
    """Return the euclidean distance between two points."""
    return sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)


class Counter:
    def __init__(self) -> None:
        self._count = 0

    def increment(self, by: int = 1) -> None:
        self._count += by

    @property
    def value(self) -> int:
        return self._count


if __name__ == "__main__":
    print(f"distance is {distance(ORIGIN, Point(3.0, 4.0))}")
`;

export const RUST_SAMPLE = `// sample.rs — a small Rust buffer

use std::fmt;

const NAME: &str = "modus-studio";
const VERSION: &str = "0.1.0";

/// A point in two dimensions.
#[derive(Debug, Clone, Copy)]
struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    fn distance(&self, other: &Point) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        (dx * dx + dy * dy).sqrt()
    }
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    let origin = Point::new(0.0, 0.0);
    let target = Point::new(3.0, 4.0);
    println!("{NAME} {VERSION}: distance is {}", origin.distance(&target));
}
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
  python: {
    id: "python",
    label: "Python",
    wasmPath: "/grammars/tree-sitter-python.wasm",
    queryPath: "/grammars/python-highlights.scm",
    sample: PYTHON_SAMPLE,
  },
  rust: {
    id: "rust",
    label: "Rust",
    wasmPath: "/grammars/tree-sitter-rust.wasm",
    queryPath: "/grammars/rust-highlights.scm",
    sample: RUST_SAMPLE,
  },
};

export const RUNTIME_WASM_PATH = "/grammars/web-tree-sitter.wasm";
