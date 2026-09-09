// The gallery / explore page — the public face of modus-studio.
//
// A responsive grid over every bundled preset, each rendered as a live-colored
// card (see ThemeCard). Client-side controls filter by text, mode, and
// collection. The themes are the visuals, so the surrounding chrome stays quiet:
// a hairline masthead, generous whitespace, and Geist type.

import { useDeferredValue, useMemo, useState } from "react";

import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import { ThemeToggle } from "~/components/ThemeToggle.tsx";
import { REPO_URL } from "~/lib/site.ts";
import { cn } from "~/lib/utils.ts";
import { COLLECTIONS, GALLERY_ENTRIES, filterEntries, type ModeFilter } from "./gallery-data.ts";
import { ThemeCard } from "./ThemeCard.tsx";

const MODE_FILTERS: readonly { value: ModeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function Gallery() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ModeFilter>("all");
  const [collection, setCollection] = useState<string | null>(null);
  const q = useDeferredValue(query);

  const entries = useMemo(
    () => filterEntries(GALLERY_ENTRIES, q, mode, collection),
    [q, mode, collection],
  );
  const isFiltered = q.trim() !== "" || mode !== "all" || collection !== null;

  function clearFilters() {
    setQuery("");
    setMode("all");
    setCollection(null);
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="mx-auto max-w-6xl px-6 pt-14 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight">
              modus<span className="text-muted-foreground">-</span>studio
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
              A gallery and editor for Emacs themes built on Protesilaos Stavrou’s modus-themes
              engine. Pick a starting point, tune the palette, export a self-contained theme.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              GitHub <span aria-hidden="true">↗</span>
            </a>
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search themes, authors, tags…"
            aria-label="Search themes"
            spellCheck={false}
            className="h-9 w-full max-w-xs text-sm"
          />
          <SegmentedControl
            options={MODE_FILTERS}
            value={mode}
            onChange={setMode}
            ariaLabel="Filter by mode"
          />
          <span className="text-muted-foreground tabular-nums text-xs">
            {isFiltered ? `${entries.length} themes match` : `${entries.length} themes`}
          </span>
        </div>

        <div
          className="mt-3 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter by collection"
        >
          <Chip active={collection === null} onClick={() => setCollection(null)}>
            All collections
          </Chip>
          {COLLECTIONS.map((c) => (
            <Chip key={c} active={collection === c} onClick={() => setCollection(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-muted-foreground text-sm">No themes match those filters.</p>
            <Button size="sm" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {entries.map((entry) => (
              <ThemeCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="bg-muted/60 inline-flex items-center rounded-md p-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-[5px] px-3 py-1 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
      )}
    >
      {children}
    </button>
  );
}
