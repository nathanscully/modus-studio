// The live code-buffer preview: a tree-sitter-highlighted, EDITABLE buffer
// rendered inside an EmacsFrame, with line numbers, a cursor, a selected region,
// and a mode-line. Each highlighted span tags its Modus role via data-role so the
// inspector can reveal which role controls any token.
//
// Editing works via the classic "overlay" technique: a transparent <textarea>
// sits on top of the highlighted <pre>, perfectly aligned (same font/metrics).
// The user types into the textarea (native caret, selection, IME); on every
// change we re-run the tree-sitter highlighter (debounced) and repaint the layer
// beneath. So typing a comment lights up the `comment` role live.

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type RefObject,
} from "react";

import { useThemeStore, type LanguageId } from "../../state/theme-store.tsx";
import { LANGUAGES } from "../../theme/highlight/languages.ts";
import { highlight, type Span } from "../../theme/highlight/parser.ts";
import type { RoleKey } from "../../theme/palette-keys.ts";
import { EmacsFrame } from "./EmacsFrame.tsx";
import type { InspectFn } from "./inspect.ts";
import { PreviewScene } from "./PreviewScene.tsx";

interface CodeBufferPreviewProps {
  /** Reveal a color/role in the editor when a preview element is clicked. */
  onInspect?: InspectFn;
}

// PERF: per-keystroke work must stay inside <EditableBuffer>. This wrapper
// depends only on `doc`/`language`, so typing (which lives entirely in the
// buffer's own state) never re-renders the themed EmacsFrame chrome or the
// ~150-node PreviewScene. The two heavy, code-independent subtrees are also
// memoized so an unrelated parent re-render can't drag them along.
export function CodeBufferPreview({ onInspect }: CodeBufferPreviewProps) {
  const { doc, language } = useThemeStore();
  const def = LANGUAGES[language];

  // Mode-line line count. Seeded from the current sample and reset whenever the
  // language changes (adjust-state-during-render, no effect). The buffer reports
  // subsequent counts as the user edits, via onLineCount in its change handler.
  const [lineCount, setLineCount] = useState(() => def.sample.split("\n").length);
  const [lastLanguage, setLastLanguage] = useState(language);
  if (language !== lastLanguage) {
    setLastLanguage(language);
    setLineCount(def.sample.split("\n").length);
  }

  const modeLine = useMemo(
    () => <ModeLine name={doc.meta.name} label={def.label} id={def.id} lineCount={lineCount} />,
    [doc.meta.name, def.label, def.id, lineCount],
  );

  return (
    <EmacsFrame doc={doc} modeLine={modeLine}>
      {/* A bounded-height editable buffer (the textarea fills it absolutely),
          followed by the scrolling role gallery in the same themed surface. */}
      <div className="h-[55%] min-h-[12rem]">
        {/* key by language so switching remounts with a fresh sample buffer */}
        <EditableBuffer
          key={language}
          language={language}
          onInspect={onInspect}
          onLineCount={setLineCount}
        />
      </div>
      <MemoScene onInspect={onInspect} />
    </EmacsFrame>
  );
}

const MemoScene = memo(PreviewScene);

function ModeLine({
  name,
  label,
  id,
  lineCount,
}: {
  name: string;
  label: string;
  id: string;
  lineCount: number;
}) {
  return (
    <>
      <span style={{ color: "var(--modus-modeline-info)" }}>{name}</span>
      <span>{label}</span>
      <span className="opacity-70">
        ({id}) <span className="tabular-nums">{lineCount}</span>L
      </span>
    </>
  );
}

// Shared type metrics for both layers — must match exactly for alignment.
const TYPE_STYLE = {
  font: "inherit",
  lineHeight: "inherit",
  margin: 0,
  border: 0,
  whiteSpace: "pre" as const,
  tabSize: 2,
};
const CODE_PAD_X = "0.75rem";

/**
 * A textarea overlaid on a highlighted layer. Both share identical type metrics
 * and the same scroll position, so the caret the user sees (textarea) lines up
 * with the colored text beneath (the highlighted layer). The textarea's own text
 * is transparent; only its caret shows.
 *
 * PERF: this component owns `code`/`spans` so a keystroke re-renders ONLY this
 * subtree, not the EmacsFrame chrome or the scene. Within it, the highlighted
 * layer is a memoized child keyed on `spans` — `spans` only changes after the
 * debounced highlight lands, so per-keystroke the layer is skipped entirely and
 * just the (cheap, uncontrolled-feeling) textarea value updates.
 */
function EditableBuffer({
  language,
  onInspect,
  onLineCount,
}: {
  language: LanguageId;
  onInspect?: InspectFn;
  onLineCount?: (n: number) => void;
}) {
  const def = LANGUAGES[language];

  // Buffer text, seeded once from the language's sample. The parent keys this
  // component by `language`, so switching language remounts it and re-seeds from
  // the new sample — no derived-state effect needed. Not persisted: the theme is
  // the artifact, the sample is scratch.
  const [code, setCode] = useState(def.sample);

  const [spans, setSpans] = useState<Span[]>([{ text: def.sample, role: null }]);

  // Re-highlight whenever the buffer text or language changes, debounced so fast
  // typing doesn't thrash the parser. Highlighting depends only on the source;
  // colors are applied via CSS variables, so editing a color never re-parses.
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      highlight(language, code).then((result) => {
        if (alive) setSpans(result);
      });
    }, 80);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [language, code]);

  // Keep the spans available to event handlers without making the click handler
  // identity depend on them (a ref avoids re-binding the textarea each keystroke).
  const spansRef = useRef(spans);
  spansRef.current = spans;

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);

  // Keep the highlighted layer scrolled in lock-step with the textarea.
  const syncScroll = useCallback(() => {
    const ta = taRef.current;
    const layer = layerRef.current;
    if (ta && layer) {
      layer.scrollTop = ta.scrollTop;
      layer.scrollLeft = ta.scrollLeft;
    }
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      setCode(next);
      onLineCount?.(next.split("\n").length);
    },
    [onLineCount],
  );

  // Map the caret's character offset back to the role painting it, then inspect.
  const handleClick = useCallback(
    (e: MouseEvent<HTMLTextAreaElement>) => {
      if (!onInspect) return;
      const role = roleAtOffset(spansRef.current, e.currentTarget.selectionStart);
      if (role) onInspect({ kind: "role", key: role });
    },
    [onInspect],
  );

  const digits = Math.max(2, String(code.split("\n").length).length);
  const gutterWidth = `calc(${digits}ch + 1rem)`;

  return (
    <div className="focus-within:ring-ring/60 relative h-full font-mono text-[13px] leading-relaxed focus-within:ring-2">
      <HighlightLayer layerRef={layerRef} spans={spans} gutterWidth={gutterWidth} />

      {/* Editable layer (on top). Transparent text, visible caret. Left-padded by
          gutter + code padding so the caret aligns with the colored text beneath. */}
      <textarea
        ref={taRef}
        value={code}
        onChange={handleChange}
        onScroll={syncScroll}
        onClick={handleClick}
        aria-label="Preview code buffer (editable sample source)"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        className="modus-buffer absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent outline-none"
        style={{
          ...TYPE_STYLE,
          paddingLeft: `calc(${gutterWidth} + ${CODE_PAD_X})`,
          paddingRight: CODE_PAD_X,
          color: "transparent",
          caretColor: "var(--modus-cursor)",
        }}
      />
    </div>
  );
}

/**
 * The colored, non-interactive layer beneath the textarea. Memoized so it only
 * re-renders when the highlight result (`spans`) or gutter width changes — never
 * on a raw keystroke. `layerRef` is forwarded so the parent can sync its scroll.
 */
const HighlightLayer = memo(function HighlightLayer({
  layerRef,
  spans,
  gutterWidth,
}: {
  layerRef: RefObject<HTMLDivElement | null>;
  spans: Span[];
  gutterWidth: string;
}) {
  const lines = useMemo(() => spansToLines(spans), [spans]);
  return (
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="grid" style={{ gridTemplateColumns: `${gutterWidth} 1fr` }}>
        {lines.map((line, lineIdx) => (
          <div key={lineIdx} className="contents">
            <div
              className="select-none px-2 text-right"
              style={{
                color: "var(--modus-fg-line-number-inactive)",
                backgroundColor: "var(--modus-bg-line-number-inactive)",
              }}
            >
              {lineIdx + 1}
            </div>
            <div style={{ ...TYPE_STYLE, paddingLeft: CODE_PAD_X, paddingRight: CODE_PAD_X }}>
              {line.length === 0 ? (
                <span>{"​"}</span>
              ) : (
                line.map((span, spanIdx) => <Token key={spanIdx} span={span} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

function Token({ span }: { span: Span }) {
  const color = span.role ? `var(--modus-${span.role})` : "var(--modus-fg-main)";
  return (
    <span data-role={span.role ?? undefined} style={{ color }}>
      {span.text}
    </span>
  );
}

/** Map a character offset in the buffer back to the Modus role painting it. */
function roleAtOffset(spans: Span[], offset: number): RoleKey | null {
  let pos = 0;
  for (const span of spans) {
    pos += span.text.length;
    if (offset < pos) return span.role;
  }
  return spans.length ? spans[spans.length - 1]!.role : null;
}

type Line = Span[];

/** Split role-tagged spans on newlines into per-line span arrays. */
function spansToLines(spans: Span[]): Line[] {
  const lines: Line[] = [[]];
  for (const span of spans) {
    const parts = span.text.split("\n");
    parts.forEach((part, idx) => {
      if (idx > 0) lines.push([]);
      if (part.length > 0) lines[lines.length - 1]!.push({ text: part, role: span.role });
    });
  }
  return lines;
}
