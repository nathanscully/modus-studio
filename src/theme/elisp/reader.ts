// A reader for the subset of Emacs Lisp syntax found in theme files. It turns
// source text into a tree of forms; it does not evaluate anything. The reader
// accepts everything the upstream modus-themes.el and ef-themes.el use (strings
// with escapes, character literals, quote/backquote/unquote, `#'`, vectors,
// `#s(...)` records, dotted pairs) and throws a positioned error on anything it
// does not recognise, so a theme that uses unexpected syntax fails loudly at
// resolve time instead of being silently misread.

export type Form =
  | { kind: "list"; items: Form[]; tail?: Form; line: number }
  | { kind: "vector"; items: Form[]; line: number }
  | { kind: "symbol"; name: string; line: number }
  | { kind: "string"; value: string; line: number }
  | { kind: "number"; value: number; line: number }
  | { kind: "char"; source: string; line: number }
  | { kind: "quote"; form: Form; line: number }
  | { kind: "backquote"; form: Form; line: number }
  | { kind: "unquote"; form: Form; splice: boolean; line: number }
  | { kind: "function"; form: Form; line: number };

// No TypeScript parameter properties in this module: the resolver runs it under
// plain Node type-stripping, which does not support them.
export class ReadError extends Error {
  readonly file: string;
  readonly line: number;

  constructor(message: string, file: string, line: number) {
    super(`${file}:${line}: ${message}`);
    this.name = "ReadError";
    this.file = file;
    this.line = line;
  }
}

const DELIMITERS = new Set([
  " ",
  "\t",
  "\n",
  "\r",
  "\f",
  "(",
  ")",
  "[",
  "]",
  '"',
  "'",
  "`",
  ",",
  ";",
]);

/** Read every top-level form in `source`. `file` is used only for error messages. */
export function readForms(source: string, file = "<string>"): Form[] {
  const reader = new Reader(source, file);
  const forms: Form[] = [];
  for (;;) {
    reader.skipBlank();
    if (reader.atEnd()) return forms;
    forms.push(reader.readForm());
  }
}

class Reader {
  private pos = 0;
  private line = 1;
  private readonly src: string;
  private readonly file: string;

  constructor(src: string, file: string) {
    this.src = src;
    this.file = file;
  }

  atEnd(): boolean {
    return this.pos >= this.src.length;
  }

  private peek(offset = 0): string {
    return this.src[this.pos + offset] ?? "";
  }

  private next(): string {
    const c = this.src[this.pos++] ?? "";
    if (c === "\n") this.line++;
    return c;
  }

  private fail(message: string, line = this.line): never {
    throw new ReadError(message, this.file, line);
  }

  skipBlank(): void {
    for (;;) {
      const c = this.peek();
      if (c === ";") {
        while (!this.atEnd() && this.peek() !== "\n") this.next();
      } else if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f") {
        this.next();
      } else {
        return;
      }
    }
  }

  readForm(): Form {
    this.skipBlank();
    const line = this.line;
    const c = this.peek();
    if (c === "") this.fail("unexpected end of input");
    switch (c) {
      case "(":
        this.next();
        return this.readSequence(")", line);
      case "[": {
        this.next();
        const list = this.readSequence("]", line);
        return { kind: "vector", items: list.items, line };
      }
      case ")":
      case "]":
        this.fail(`unexpected "${c}"`);
      // eslint-disable-next-line no-fallthrough
      case '"':
        return this.readString(line);
      case "'":
        this.next();
        return { kind: "quote", form: this.readForm(), line };
      case "`":
        this.next();
        return { kind: "backquote", form: this.readForm(), line };
      case ",": {
        this.next();
        const splice = this.peek() === "@";
        if (splice) this.next();
        return { kind: "unquote", form: this.readForm(), splice, line };
      }
      case "?":
        return this.readChar(line);
      case "#":
        return this.readHash(line);
      default:
        return this.readAtom(line);
    }
  }

  private readSequence(close: ")" | "]", line: number): Extract<Form, { kind: "list" }> {
    const items: Form[] = [];
    let tail: Form | undefined;
    for (;;) {
      this.skipBlank();
      const c = this.peek();
      if (c === "") this.fail(`unterminated list opened on line ${line}`, line);
      if (c === close) {
        this.next();
        return { kind: "list", items, tail, line };
      }
      if (c === "." && DELIMITERS.has(this.peek(1))) {
        this.next();
        tail = this.readForm();
        this.skipBlank();
        if (this.peek() !== close) this.fail("expected closing paren after dotted tail");
        this.next();
        return { kind: "list", items, tail, line };
      }
      items.push(this.readForm());
    }
  }

  private readString(line: number): Form {
    this.next();
    let out = "";
    for (;;) {
      const c = this.next();
      if (c === "") this.fail(`unterminated string opened on line ${line}`, line);
      if (c === '"') return { kind: "string", value: out, line };
      if (c !== "\\") {
        out += c;
        continue;
      }
      const e = this.next();
      switch (e) {
        case "\n":
          break;
        case "n":
          out += "\n";
          break;
        case "t":
          out += "\t";
          break;
        case "r":
          out += "\r";
          break;
        case "f":
          out += "\f";
          break;
        case "e":
          out += "";
          break;
        case "s":
          out += " ";
          break;
        case "d":
          out += "";
          break;
        case "a":
          out += "";
          break;
        case "b":
          out += "\b";
          break;
        case "v":
          out += "\v";
          break;
        case "x": {
          let hex = "";
          while (/[0-9a-fA-F]/.test(this.peek())) hex += this.next();
          if (this.peek() === "\\" && this.peek(1) === " ") {
            this.next();
            this.next();
          }
          out += String.fromCodePoint(parseInt(hex || "0", 16));
          break;
        }
        case "u": {
          const hex = this.src.slice(this.pos, this.pos + 4);
          this.pos += 4;
          out += String.fromCodePoint(parseInt(hex, 16));
          break;
        }
        case "U": {
          const hex = this.src.slice(this.pos, this.pos + 8);
          this.pos += 8;
          out += String.fromCodePoint(parseInt(hex, 16));
          break;
        }
        case "N": {
          if (this.peek() !== "{") this.fail("expected { after \\N");
          while (!this.atEnd() && this.next() !== "}");
          out += "�";
          break;
        }
        case "C":
        case "M":
        case "S":
        case "H":
        case "A":
        case "s-":
        case "^":
          this.fail("modifier escapes are not supported inside strings");
        // eslint-disable-next-line no-fallthrough
        default:
          if (/[0-7]/.test(e)) {
            let oct = e;
            while (oct.length < 3 && /[0-7]/.test(this.peek())) oct += this.next();
            out += String.fromCodePoint(parseInt(oct, 8));
          } else {
            out += e;
          }
      }
    }
  }

  private readChar(line: number): Form {
    const start = this.pos;
    this.next();
    this.readCharSpec();
    return { kind: "char", source: this.src.slice(start, this.pos), line };
  }

  // Consumes one character specification after `?`: a plain character, a
  // backslash escape, or a modifier prefix (\C- \M- \S- \H- \s- \A- \^) followed
  // by another specification.
  private readCharSpec(): void {
    const c = this.next();
    if (c === "") this.fail("unexpected end of input in character literal");
    if (c !== "\\") return;
    const e = this.next();
    if (e === "^") {
      this.next();
      return;
    }
    if ("CMSHAs".includes(e) && this.peek() === "-") {
      this.next();
      this.readCharSpec();
      return;
    }
    if (e === "x") {
      while (/[0-9a-fA-F]/.test(this.peek())) this.next();
      return;
    }
    if (e === "u") {
      this.pos += 4;
      return;
    }
    if (e === "U") {
      this.pos += 8;
      return;
    }
    if (e === "N") {
      while (!this.atEnd() && this.next() !== "}");
      return;
    }
    if (/[0-7]/.test(e)) {
      let n = 1;
      while (n < 3 && /[0-7]/.test(this.peek())) {
        this.next();
        n++;
      }
    }
  }

  private readHash(line: number): Form {
    this.next();
    const c = this.peek();
    if (c === "'") {
      this.next();
      return { kind: "function", form: this.readForm(), line };
    }
    if (c === "s" && this.peek(1) === "(") {
      this.next();
      this.next();
      const list = this.readSequence(")", line);
      return {
        kind: "list",
        items: [{ kind: "symbol", name: "#s", line }, ...list.items],
        line,
      };
    }
    if (c === "(") {
      this.next();
      const list = this.readSequence(")", line);
      return list.items[0] ?? list;
    }
    if (c === ":") {
      this.next();
      const atom = this.readAtom(line);
      if (atom.kind === "symbol") return { kind: "symbol", name: `#:${atom.name}`, line };
      return atom;
    }
    if (c === "x" || c === "X" || c === "o" || c === "O" || c === "b" || c === "B") {
      this.next();
      const radix = c === "x" || c === "X" ? 16 : c === "o" || c === "O" ? 8 : 2;
      let digits = "";
      while (!this.atEnd() && !DELIMITERS.has(this.peek())) digits += this.next();
      const value = parseInt(digits, radix);
      if (Number.isNaN(value)) this.fail(`bad radix literal #${c}${digits}`);
      return { kind: "number", value, line };
    }
    this.fail(`unsupported reader syntax "#${c}"`);
  }

  private readAtom(line: number): Form {
    let text = "";
    let escaped = false;
    for (;;) {
      const c = this.peek();
      if (c === "") break;
      if (c === "\\") {
        this.next();
        text += this.next();
        escaped = true;
        continue;
      }
      if (DELIMITERS.has(c)) break;
      text += this.next();
    }
    if (text === "") this.fail(`unexpected character "${this.peek()}"`);
    if (!escaped) {
      if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(text) && text !== "+" && text !== "-") {
        return {
          kind: "number",
          value: Number(text.endsWith(".") ? text.slice(0, -1) : text),
          line,
        };
      }
    }
    return { kind: "symbol", name: text, line };
  }
}

/** Convenience: the printed form, close to how Emacs would print it. */
export function printForm(form: Form): string {
  switch (form.kind) {
    case "list": {
      const body = form.items.map(printForm).join(" ");
      return form.tail ? `(${body} . ${printForm(form.tail)})` : `(${body})`;
    }
    case "vector":
      return `[${form.items.map(printForm).join(" ")}]`;
    case "symbol":
      return form.name;
    case "string":
      return JSON.stringify(form.value);
    case "number":
      return String(form.value);
    case "char":
      return form.source;
    case "quote":
      return `'${printForm(form.form)}`;
    case "backquote":
      return `\`${printForm(form.form)}`;
    case "unquote":
      return `${form.splice ? ",@" : ","}${printForm(form.form)}`;
    case "function":
      return `#'${printForm(form.form)}`;
  }
}
