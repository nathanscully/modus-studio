// A single gallery card. The upper part is a link to /theme/$themeId that
// previews the theme in its own colors: a "buffer" painting bg-main with the
// static snippet styled by the theme's resolved syntax roles, the eight
// swatches, then label, mode and author. Below the link sits a credit row for
// the theme's upstream: license, repo link and an install-snippet copy button,
// since every theme here belongs to its author, not to this site.

import { CopyIcon, ExternalLinkIcon } from "lucide-react";
import { memo } from "react";

import { Link } from "@tanstack/react-router";

import { copyInstall, LicenseBadge } from "~/components/editor/SourcePanel.tsx";
import { Button } from "~/components/ui/button.tsx";
import { cn } from "~/lib/utils.ts";
import type { GalleryEntry } from "./gallery-data.ts";
import { SNIPPET_LINES } from "./snippet.ts";

function snippetColor(role: GalleryEntry["roleColors"], key: string, fallback: string): string {
  return (role as Record<string, string | undefined>)[key] ?? fallback;
}

export const ThemeCard = memo(function ThemeCard({ entry }: { entry: GalleryEntry }) {
  return (
    <article
      className={cn(
        "group bg-card flex flex-col overflow-hidden rounded-xl border transition-[transform,box-shadow]",
        "hover:-translate-y-0.5 hover:shadow-lg",
      )}
      style={{ borderColor: "var(--border)" }}
    >
      <Link
        to="/theme/$themeId"
        params={{ themeId: entry.id }}
        className="focus-visible:ring-ring/60 block focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
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

        <div className="flex items-start justify-between gap-3 px-3.5 pt-3 pb-2">
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

      <div className="mt-auto flex items-center gap-2 px-3.5 pb-3">
        <LicenseBadge license={entry.license} />
        <span className="ml-auto flex items-center gap-0.5">
          {entry.install ? (
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={`Copy install snippet for ${entry.label}`}
              title={entry.install}
              onClick={() => copyInstall(entry.install!)}
            >
              <CopyIcon aria-hidden="true" />
            </Button>
          ) : null}
          {entry.repoUrl ? (
            <Button asChild size="icon-xs" variant="ghost">
              <a
                href={entry.repoUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open the source of ${entry.label}`}
                title={entry.repoUrl}
              >
                <ExternalLinkIcon aria-hidden="true" />
              </a>
            </Button>
          ) : null}
        </span>
      </div>
    </article>
  );
});
