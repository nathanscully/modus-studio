// A static "gallery" of Emacs surfaces rendered below the editable code buffer,
// built to exercise far more Modus keys than code highlighting alone reaches:
// region, search/isearch, completion, diffs, paren-match, diagnostics, headings,
// rainbow delimiters, whitespace, marks, links, prose and prompt. Every element
// is painted from a `--modus-<key>` CSS variable, so changing any of those keys
// in the editor repaints the matching swatch live. Clicking a labelled element
// inspects its key — routing to the Palette tab for layer-1 named colors (e.g.
// bg-region) or the Mappings tab for layer-2 roles (e.g. bg-space).
//
// Each section is intentionally compact; the goal is coverage + a live target for
// every common key, not a faithful reproduction of a real Emacs session.

import type { ReactNode } from "react";

import { isColorKey, type ColorKey, type RoleKey } from "../../theme/palette-keys.ts";
import type { InspectFn, InspectTarget } from "./inspect.ts";

interface PreviewSceneProps {
  onInspect?: InspectFn;
}

export function PreviewScene({ onInspect }: PreviewSceneProps) {
  return (
    <div className="space-y-4 border-t px-3 py-3 font-mono text-[13px] leading-relaxed">
      <Section title="Region & line highlight">
        <div style={{ backgroundColor: v("bg-hl-line") }}>
          <K name="bg-hl-line" inspect={onInspect}>
            current line (bg-hl-line)
          </K>
        </div>
        <div>
          plain{" "}
          <span style={{ backgroundColor: v("bg-region"), color: v("fg-region") }}>
            <K name="bg-region" inspect={onInspect}>
              selected region
            </K>
          </span>{" "}
          plain
        </div>
      </Section>

      <Section title="Search & replace">
        the{" "}
        <Hl bg="bg-search-current" fg="fg-search-current" inspect={onInspect}>
          current
        </Hl>{" "}
        match, a{" "}
        <Hl bg="bg-search-lazy" fg="fg-search-lazy" inspect={onInspect}>
          lazy
        </Hl>{" "}
        one, and a{" "}
        <Hl bg="bg-search-replace" fg="fg-search-replace" inspect={onInspect}>
          replacement
        </Hl>
        .
      </Section>

      <Section title="Completion popup">
        <div
          className="inline-block rounded border"
          style={{ backgroundColor: v("bg-popup"), borderColor: v("border") }}
        >
          <CompletionRow inspect={onInspect} active match="0" tail="-file" />
          <CompletionRow inspect={onInspect} match="1" tail="-library" />
          <CompletionRow inspect={onInspect} match="2" tail="-function" />
          <CompletionRow inspect={onInspect} match="3" tail="-variable" />
        </div>
      </Section>

      <Section title="Diff hunk">
        <DiffLine kind="added" sign="+" inspect={onInspect}>
          (defun added-line () t)
        </DiffLine>
        <DiffLine kind="changed" sign="~" inspect={onInspect}>
          (defun changed-line () nil)
        </DiffLine>
        <DiffLine kind="removed" sign="-" inspect={onInspect}>
          (defun removed-line () t)
        </DiffLine>
      </Section>

      <Section title="Parentheses & delimiters">
        <span>matched </span>
        <span style={{ backgroundColor: v("bg-paren-match"), color: v("fg-paren-match") }}>
          <K name="bg-paren-match" inspect={onInspect}>
            ()
          </K>
        </span>{" "}
        <span>rainbow </span>
        {RANGE9.map((n) => (
          <span key={n} style={{ color: v(`rainbow-${n}`) }}>
            <K name={`rainbow-${n}`} inspect={onInspect}>
              (
            </K>
          </span>
        ))}
      </Section>

      <Section title="Diagnostics">
        <Diag roleKey="err" under="underline-err" inspect={onInspect}>
          error
        </Diag>{" "}
        <Diag roleKey="warning" under="underline-warning" inspect={onInspect}>
          warning
        </Diag>{" "}
        <Diag roleKey="info" under="underline-note" inspect={onInspect}>
          note
        </Diag>{" "}
        <Prominent kind="err" inspect={onInspect}>
          ERR
        </Prominent>{" "}
        <Prominent kind="warning" inspect={onInspect}>
          WARN
        </Prominent>{" "}
        <Prominent kind="note" inspect={onInspect}>
          NOTE
        </Prominent>
      </Section>

      <Section title="Headings">
        {RANGE9.map((n) => (
          <div key={n}>
            <span style={{ color: v(`fg-heading-${n}`), backgroundColor: v(`bg-heading-${n}`) }}>
              <K name={`fg-heading-${n}`} inspect={onInspect}>
                {"*".repeat(n + 1)} Heading level {n}
              </K>
            </span>
          </div>
        ))}
      </Section>

      <Section title="Links & prose">
        {/* Decorative previews of the link faces — not real navigation, so plain
            spans styled as links (avoids href-less <a> a11y pitfalls). */}
        <span style={{ color: v("fg-link"), textDecoration: "underline" }}>
          <K name="fg-link" inspect={onInspect}>
            https://example.com
          </K>
        </span>{" "}
        <span style={{ color: v("fg-link-visited"), textDecoration: "underline" }}>
          <K name="fg-link-visited" inspect={onInspect}>
            visited
          </K>
        </span>{" "}
        <span style={{ color: v("fg-prose-code"), backgroundColor: v("bg-prose-code") }}>
          <K name="fg-prose-code" inspect={onInspect}>
            `code`
          </K>
        </span>{" "}
        <span style={{ color: v("fg-prose-verbatim"), backgroundColor: v("bg-prose-verbatim") }}>
          <K name="fg-prose-verbatim" inspect={onInspect}>
            =verbatim=
          </K>
        </span>{" "}
        <span style={{ color: v("prose-done") }}>
          <K name="prose-done" inspect={onInspect}>
            DONE
          </K>
        </span>{" "}
        <span style={{ color: v("prose-todo") }}>
          <K name="prose-todo" inspect={onInspect}>
            TODO
          </K>
        </span>
      </Section>

      <Section title="Marks (dired)">
        <MarkLine kind="delete" sign="D" inspect={onInspect}>
          old-backup.el
        </MarkLine>
        <MarkLine kind="select" sign="*" inspect={onInspect}>
          selected.el
        </MarkLine>
        <MarkLine kind="other" sign="#" inspect={onInspect}>
          flagged.el
        </MarkLine>
      </Section>

      <Section title="Whitespace & prompt">
        <span style={{ backgroundColor: v("bg-space"), color: v("fg-space") }}>
          <K name="bg-space" inspect={onInspect}>
            ·spaces·
          </K>
        </span>{" "}
        <span style={{ backgroundColor: v("bg-space-err") }}>
          <K name="bg-space-err" inspect={onInspect}>
            trailing
          </K>
        </span>{" "}
        <span style={{ color: v("fg-prompt"), backgroundColor: v("bg-prompt") }}>
          <K name="fg-prompt" inspect={onInspect}>
            M-x{" "}
          </K>
        </span>
        <span style={{ backgroundColor: v("bg-active-value"), color: v("fg-active-value") }}>
          <K name="bg-active-value" inspect={onInspect}>
            value
          </K>
        </span>
      </Section>
    </div>
  );
}

const RANGE9 = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

/** A CSS var() reference for a Modus key (color or role). */
function v(name: string): string {
  return `var(--modus-${name})`;
}

/** Build the right InspectTarget for a key by checking which layer it lives in. */
function targetFor(name: string): InspectTarget {
  return isColorKey(name)
    ? { kind: "color", key: name as ColorKey }
    : { kind: "role", key: name as RoleKey };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-1 text-[10px] tracking-wide uppercase opacity-50">{title}</div>
      <div>{children}</div>
    </section>
  );
}

/**
 * Wrap content so clicking it inspects `name` (color or role) in the editor.
 * Tags `data-key` for debugging and shows the key as a tooltip; does not alter
 * layout or color — the caller styles the element.
 */
function K({
  name,
  inspect,
  children,
}: {
  name: string;
  inspect?: InspectFn;
  children: ReactNode;
}) {
  // When inspectable, render a real <button> so keyboard users can trigger the
  // jump-to-editor action (Enter/Space) and screen readers announce it. The
  // button is visually inline and inherits the surrounding text color/background.
  if (inspect) {
    return (
      <button
        type="button"
        data-key={name}
        title={name}
        aria-label={`Edit ${name}`}
        onClick={() => inspect(targetFor(name))}
        className="cursor-pointer bg-transparent p-0 font-[inherit] text-[inherit] [color:inherit]"
      >
        {children}
      </button>
    );
  }
  return (
    <span data-key={name} title={name}>
      {children}
    </span>
  );
}

/** Foreground+background highlighted inline run (search matches, etc.). */
function Hl({
  bg,
  fg,
  inspect,
  children,
}: {
  bg: string;
  fg: string;
  inspect?: InspectFn;
  children: ReactNode;
}) {
  return (
    <span style={{ backgroundColor: v(bg), color: v(fg) }}>
      <K name={bg} inspect={inspect}>
        {children}
      </K>
    </span>
  );
}

function CompletionRow({
  active,
  match,
  tail,
  inspect,
}: {
  active?: boolean;
  match: "0" | "1" | "2" | "3";
  tail: string;
  inspect?: InspectFn;
}) {
  return (
    <div className="px-2" style={active ? { backgroundColor: v("bg-completion") } : undefined}>
      <span style={{ color: v(`fg-completion-match-${match}`) }}>
        <K name={`fg-completion-match-${match}`} inspect={inspect}>
          find
        </K>
      </span>
      <span>{tail}</span>
    </div>
  );
}

function DiffLine({
  kind,
  sign,
  inspect,
  children,
}: {
  kind: "added" | "changed" | "removed";
  sign: string;
  inspect?: InspectFn;
  children: ReactNode;
}) {
  return (
    <div style={{ backgroundColor: v(`bg-${kind}`), color: v(`fg-${kind}`) }}>
      <span
        className="inline-block w-4 text-center"
        style={{ backgroundColor: v(`bg-${kind}-fringe`) }}
      >
        {sign}
      </span>
      <K name={`bg-${kind}`} inspect={inspect}>
        {children}
      </K>
    </div>
  );
}

function Diag({
  roleKey,
  under,
  inspect,
  children,
}: {
  roleKey: RoleKey;
  under: RoleKey;
  inspect?: InspectFn;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        color: v(roleKey),
        textDecoration: "underline",
        textDecorationStyle: "wavy",
        textDecorationColor: v(under),
      }}
    >
      <K name={roleKey} inspect={inspect}>
        {children}
      </K>
    </span>
  );
}

function Prominent({
  kind,
  inspect,
  children,
}: {
  kind: "err" | "warning" | "note";
  inspect?: InspectFn;
  children: ReactNode;
}) {
  return (
    <span
      className="rounded px-1"
      style={{ backgroundColor: v(`bg-prominent-${kind}`), color: v(`fg-prominent-${kind}`) }}
    >
      <K name={`bg-prominent-${kind}`} inspect={inspect}>
        {children}
      </K>
    </span>
  );
}

function MarkLine({
  kind,
  sign,
  inspect,
  children,
}: {
  kind: "delete" | "select" | "other";
  sign: string;
  inspect?: InspectFn;
  children: ReactNode;
}) {
  return (
    <div style={{ backgroundColor: v(`bg-mark-${kind}`), color: v(`fg-mark-${kind}`) }}>
      <span className="inline-block w-4 text-center font-bold">{sign}</span>
      <K name={`bg-mark-${kind}`} inspect={inspect}>
        {children}
      </K>
    </div>
  );
}
