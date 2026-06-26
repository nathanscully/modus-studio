// A searchable color/value picker used by the mapping editor.
//
// PERF: replaces a Radix <Select> that eagerly mounted all ~165 palette options
// into a portal on open (~150ms per open). It also avoids cmdk, which keeps every
// item mounted to filter them (even heavier — ~440ms for 165 items). Instead we
// render at most MAX_VISIBLE option buttons: an empty search shows the first
// slice, and typing narrows the list. So a popover open paints ~25 rows, not 165.

import { memo, useDeferredValue, useMemo, useState } from "react";

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
          aria-haspopup="listbox"
          aria-expanded={open}
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
  selectedKey,
  onChoose,
}: {
  selectedKey: string;
  onChoose: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  // Defer filtering so typing stays responsive even though the source list is big.
  const q = useDeferredValue(query.trim().toLowerCase());

  const { specials, colors, total, shown } = useMemo(() => {
    const specials = q ? SPECIALS.filter((s) => s.label.toLowerCase().includes(q)) : SPECIALS;
    const matches = q ? COLOR_KEYS.filter((c) => c.toLowerCase().includes(q)) : COLOR_KEYS;
    const colors = matches.slice(0, MAX_VISIBLE);
    return { specials, colors, total: matches.length, shown: colors.length };
  }, [q]);

  return (
    <div>
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search color…"
        spellCheck={false}
        className="mb-1 h-8 font-mono text-xs"
      />
      <div className="max-h-64 overflow-auto">
        {specials.map((s) => (
          <Option
            key={s.value}
            label={s.label}
            selected={selectedKey === s.value}
            onChoose={() => onChoose(s.value)}
          />
        ))}
        {colors.map((c) => (
          <Option key={c} label={c} selected={selectedKey === c} onChoose={() => onChoose(c)} />
        ))}
        {specials.length + colors.length === 0 ? (
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

function Option({
  label,
  selected,
  onChoose,
}: {
  label: string;
  selected: boolean;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChoose}
      className={cn(
        "hover:bg-accent flex w-full items-center gap-1 rounded px-2 py-1 text-left font-mono text-xs",
        selected && "bg-accent/60",
      )}
    >
      <span className={cn("w-3", selected ? "opacity-100" : "opacity-0")}>✓</span>
      {label}
    </button>
  );
}
