// A single gallery card: a real link to /theme/$themeId that previews the theme
// in its own colors. The upper "buffer" paints bg-main with the static snippet
// styled by this theme's resolved syntax roles; the lower strip shows the eight
// swatches and the metadata (label, mode badge, author). App chrome (Geist type,
// card border, hover lift) frames it, but the visual is the theme itself.

import { memo } from "react";

import { Link } from "@tanstack/react-router";

import { cn } from "~/lib/utils.ts";
import type { GalleryEntry } from "./gallery-data.ts";
import { SNIPPET_LINES } from "./snippet.ts";

function snippetColor(role: GalleryEntry["roleColors"], key: string, fallback: string): string {
  return (role as Record<string, string | undefined>)[key] ?? fallback;
}

export const ThemeCard = memo(function ThemeCard({ entry }: { entry: GalleryEntry }) {
  return (
    <Link
      to="/theme/$themeId"
      params={{ themeId: entry.id }}
      className={cn(
        "group focus-visible:ring-ring/60 block overflow-hidden rounded-xl border transition-[transform,box-shadow]",
        "hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
      )}
      style={{ borderColor: "var(--border)" }}
      aria-label={`Open ${entry.label} in the editor`}
    >
      <div
        className="relative px-4 pt-4 pb-3 font-mono text-[11px] leading-[1.55]"
        style={{ backgroundColor: entry.bgMain, color: entry.fgMain }}
      >
        <pre className="overflow-hidden whitespace-pre">
          {SNIPPET_LINES.map((line, i) => (
            <div key={i}>
              {line.length === 0
                ? "​"
                : line.map((span, j) => (
                    <span
                      key={j}
                      style={
                        span.role
                          ? { color: snippetColor(entry.roleColors, span.role, entry.fgMain) }
                          : undefined
                      }
                    >
                      {span.text}
                    </span>
                  ))}
            </div>
          ))}
        </pre>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6"
          style={{ background: `linear-gradient(to top, ${entry.bgMain}, transparent)` }}
        />
      </div>

      <div className="flex" aria-hidden>
        {entry.swatches.map((hex, i) => (
          <div key={i} className="h-1.5 flex-1" style={{ backgroundColor: hex }} />
        ))}
      </div>

      <div className="bg-card flex items-start justify-between gap-3 px-3.5 py-3">
        <div className="min-w-0">
          <div
            className="text-foreground truncate text-sm font-medium tracking-tight"
            title={entry.label}
          >
            {entry.label}
          </div>
          {entry.author ? (
            <div className="text-muted-foreground mt-0.5 truncate text-xs" title={entry.author}>
              {entry.author}
            </div>
          ) : null}
          {entry.description ? (
            <p className="text-muted-foreground mt-1 truncate text-xs" title={entry.description}>
              {entry.description}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
            entry.mode === "dark"
              ? "border-zinc-700 bg-zinc-900 text-zinc-100"
              : "border-zinc-300 bg-zinc-100 text-zinc-700",
          )}
        >
          {entry.mode}
        </span>
      </div>
    </Link>
  );
});
