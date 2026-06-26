// The chrome wrapper for the preview: a fake Emacs frame whose colors are driven
// entirely by CSS custom properties computed from the current ThemeDoc.

import { useMemo, type CSSProperties, type ReactNode } from "react";

import { themeCssVars } from "../../theme/css-vars.ts";
import type { ThemeDoc } from "../../theme/types.ts";

interface EmacsFrameProps {
  doc: ThemeDoc;
  modeLine: ReactNode;
  children: ReactNode;
}

export function EmacsFrame({ doc, modeLine, children }: EmacsFrameProps) {
  // PERF: resolving all ~130 roles to hex (themeCssVars → resolveAll) is the
  // frame's only real cost; recompute it only when the theme doc changes, not on
  // unrelated re-renders (e.g. the mode-line's line count ticking).
  const style = useMemo(
    () =>
      ({
        ...themeCssVars(doc),
        backgroundColor: "var(--modus-bg-main)",
        color: "var(--modus-fg-main)",
      }) as CSSProperties,
    [doc],
  );

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-lg border shadow-sm"
      style={{ ...style, borderColor: "var(--modus-border)" }}
    >
      <div className="min-h-0 flex-1 overflow-auto font-mono text-[13px] leading-relaxed">
        {children}
      </div>
      <div
        className="flex items-center gap-3 px-3 py-1 font-mono text-xs"
        style={{
          backgroundColor: "var(--modus-bg-mode-line-active)",
          color: "var(--modus-fg-mode-line-active)",
          borderTop: "1px solid var(--modus-border-mode-line-active)",
        }}
      >
        {modeLine}
      </div>
    </div>
  );
}
