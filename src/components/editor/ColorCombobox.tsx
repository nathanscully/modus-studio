// A searchable color/value picker used by the mapping editor.
//
// PERF: replaces a Radix <Select> that eagerly mounted all ~165 palette options
// into a portal on open (~150ms per open). It also avoids cmdk, which keeps every
// item mounted to filter them (even heavier — ~440ms for 165 items). Instead we
// render at most MAX_VISIBLE option buttons: an empty search shows the first
// slice, and typing narrows the list. So a popover open paints ~25 rows, not 165.

import { memo, useCallback, useDeferredValue, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { Input } from "~/components/ui/input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover.tsx";
import { Button } from "~/components/ui/button.tsx";
import { cn } from "~/lib/utils.ts";
import { COLOR_KEYS } from "~/theme/palette-keys.ts";
import { UNSPECIFIED } from "~/theme/resolve.ts";

// Sentinel kept distinct from real color names and the "unspecified" keyword.
export const HEX_OPTION = "__hex__";

// Cap how many option rows are mounted at once. The two specials + this many
// palette colors is all React ever reconciles per open, so the popover is cheap
// regardless of the full palette size.
const MAX_VISIBLE = 30;

const SPECIALS: { value: string; label: string }[] = [
  { value: UNSPECIFIED, label: "unspecified" },
  { value: HEX_OPTION, label: "raw hex…" },
];

interface ColorComboboxProps {
  /** Label shown on the trigger (current value, "unspecified", or "raw hex"). */
  triggerLabel: string;
  /** Resolved hex for the small swatch on the trigger, or null. */
  swatch: string | null;
  /** Currently-selected option key, for the check mark. */
  selectedKey: string;
  ariaLabel: string;
  onSelect: (value: string) => void;
}

export const ColorCombobox = memo(function ColorCombobox({
  triggerLabel,
  swatch,
  selectedKey,
  ariaLabel,
  onSelect,
}: ColorComboboxProps) {
  const [open, setOpen] = useState(false);
  const listboxId = `${useId()}-listbox`;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-label={ariaLabel}
          className="h-8 w-40 justify-start gap-2 px-2 font-mono text-xs font-normal"
        >
          <span
            className="border-input size-4 shrink-0 rounded-sm border"
            style={{ backgroundColor: swatch ?? "transparent" }}
          />
          <span className="truncate">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="start">
        {/* Mounted only while open. The list inside caps how many rows render. */}
        <ColorList
          listboxId={listboxId}
          selectedKey={selectedKey}
          onChoose={(v) => {
            setOpen(false);
            onSelect(v);
          }}
        />
      </PopoverContent>
    </Popover>
  );
});

function ColorList({
  listboxId,
  selectedKey,
  onChoose,
}: {
  listboxId: string;
  selectedKey: string;
  onChoose: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  // Defer filtering so typing stays responsive even though the source list is big.
  const q = useDeferredValue(query.trim().toLowerCase());
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { options, total, shown } = useMemo(() => {
    const specials = q ? SPECIALS.filter((s) => s.label.toLowerCase().includes(q)) : SPECIALS;
    const matches = q ? COLOR_KEYS.filter((c) => c.toLowerCase().includes(q)) : COLOR_KEYS;
    const colors = matches.slice(0, MAX_VISIBLE);
    const options = [...specials, ...colors.map((c) => ({ value: c, label: c }))];
    return { options, total: matches.length, shown: colors.length };
  }, [q]);

  // Clamp rather than reset on every render: typing shrinks the list, and an
  // index left past the end would highlight nothing.
  const activeIndex = options.length === 0 ? -1 : Math.min(active, options.length - 1);
  const activeId = activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined;

  const moveTo = useCallback((index: number) => {
    setActive(index);
    scrollOptionIntoView(listRef.current, index);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (options.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveTo((activeIndex + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveTo((activeIndex - 1 + options.length) % options.length);
        break;
      case "Home":
        e.preventDefault();
        moveTo(0);
        break;
      case "End":
        e.preventDefault();
        moveTo(options.length - 1);
        break;
      case "Enter": {
        const option = options[activeIndex];
        if (!option) return;
        e.preventDefault();
        onChoose(option.value);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div>
      <Input
        autoFocus
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded
        aria-controls={listboxId}
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        aria-label="Search color"
        placeholder="Search color…"
        spellCheck={false}
        className="mb-1 h-8 font-mono text-xs"
      />
      <div className="max-h-64 overflow-auto">
        <div ref={listRef} id={listboxId} role="listbox" aria-label="Colors">
          {options.map((o, i) => (
            <Option
              key={o.value}
              id={`${listboxId}-opt-${i}`}
              label={o.label}
              selected={selectedKey === o.value}
              active={i === activeIndex}
              onChoose={() => onChoose(o.value)}
            />
          ))}
        </div>
        {options.length === 0 ? (
          <div className="text-muted-foreground px-2 py-1.5 text-xs">No match.</div>
        ) : null}
        {total > shown ? (
          <div className="text-muted-foreground px-2 py-1 text-[10px]">
            +{total - shown} more — keep typing to narrow
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Keep the highlighted row visible without stealing focus from the search input.
// jsdom has no scrollIntoView, hence the guard.
function scrollOptionIntoView(list: HTMLElement | null, index: number) {
  const row = list?.children[index];
  if (row instanceof HTMLElement && typeof row.scrollIntoView === "function") {
    row.scrollIntoView({ block: "nearest" });
  }
}

function Option({
  id,
  label,
  selected,
  active,
  onChoose,
}: {
  id: string;
  label: string;
  selected: boolean;
  active: boolean;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      onClick={onChoose}
      className={cn(
        "hover:bg-accent flex w-full items-center gap-1 rounded px-2 py-1 text-left font-mono text-xs",
        selected && "bg-accent/60",
        active && "bg-accent",
      )}
    >
      <span aria-hidden="true" className={cn("w-3", selected ? "opacity-100" : "opacity-0")}>
        ✓
      </span>
      {label}
    </button>
  );
}
