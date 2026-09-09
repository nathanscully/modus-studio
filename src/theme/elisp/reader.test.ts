import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { printForm, ReadError, readForms } from "./reader.ts";

const FIXTURES = join(import.meta.dirname, "__fixtures__");

function fixtureFiles(): string[] {
  const out: string[] = [];
  for (const dir of readdirSync(FIXTURES)) {
    const full = join(FIXTURES, dir);
    if (!statSync(full).isDirectory() || dir === "emacs-31") continue;
    for (const f of readdirSync(full)) if (f.endsWith(".el")) out.push(join(dir, f));
  }
  return out;
}

describe("elisp reader", () => {
  it.each(fixtureFiles())("reads every top-level form of %s", (rel) => {
    const forms = readForms(readFileSync(join(FIXTURES, rel), "utf8"), rel);
    expect(forms.length).toBeGreaterThan(0);
  });

  it("reads quoted alists with strings and symbols", () => {
    const [form] = readForms(
      `'((bg-main "#ffffff") (keyword magenta-cooler) (fringe unspecified))`,
    );
    expect(form?.kind).toBe("quote");
    expect(printForm(form!)).toBe(
      `'((bg-main "#ffffff") (keyword magenta-cooler) (fringe unspecified))`,
    );
  });

  it("handles comments, character literals, backquote and #'", () => {
    const src = `;; header\n(list ?\\( ?a ?\\C-x \`(foo ,bar ,@baz) #'car "a\\"b" 1.5 -3 #x1f)`;
    const [form] = readForms(src);
    expect(printForm(form!)).toBe(
      `(list ?\\( ?a ?\\C-x \`(foo ,bar ,@baz) #'car "a\\"b" 1.5 -3 31)`,
    );
  });

  it("reads dotted pairs and vectors", () => {
    const [a, b] = readForms(`(a . b) [1 2 3]`);
    expect(printForm(a!)).toBe("(a . b)");
    expect(printForm(b!)).toBe("[1 2 3]");
  });

  it("reports the file and line on a syntax error", () => {
    expect(() => readForms(`(defconst x\n  '((a "1")\n`, "broken.el")).toThrow(ReadError);
    try {
      readForms(`(defconst x\n  '((a "1")\n`, "broken.el");
    } catch (e) {
      expect((e as ReadError).file).toBe("broken.el");
      expect((e as ReadError).message).toMatch(/^broken\.el:\d+: unterminated list/);
    }
  });
});
