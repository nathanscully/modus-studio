// A searchable, grouped combobox for picking the base preset.
//
// Replaces the Radix <Select> in the toolbar: with 40 presets (2 Modus + 38
// ef-themes) a plain dropdown is tedious to scan, so this filters as you type
// while preserving the family grouping (Modus / Ef — light / Ef — dark). The
// preset list is small, so unlike ColorCombobox there's no need to cap rows —
// every match renders, group headers and all.

import { memo, useCallback, useDeferredValue, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover.tsx";
import { cn } from "~/lib/utils.ts";
import { PRESET_GROUPS } from "~/theme/presets.ts";

interface PresetComboboxProps {
  /** The currently-selected preset id. */
  value: string;
  onSelect: (presetId: string) => void;
}

// Label of the active preset, for the trigger. Falls back to a placeholder.
function labelFor(value: string): string {
  for (const group of PRESET_GROUPS) {
    const p = group.presets.find((p) => p.id === value);
    if (p) return p.label;
  }
  return "Base preset";
}

export const PresetCombobox = memo(function PresetCombobox({
  value,
  onSelect,
}: PresetComboboxProps) {
  const [open, setOpen] = useState(false);
  const listboxId = `${useId()}-listbox`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-label="Base preset"
          className="w-52 justify-between text-xs font-normal"
        >
          <span className="truncate">{labelFor(value)}</span>
          <span aria-hidden="true" className="text-muted-foreground ml-2 shrink-0 opacity-70">
            ▾
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        {/* Mounted only while open. */}
        <PresetList
          listboxId={listboxId}
          selected={value}
          onChoose={(id) => {
            setOpen(false);
            onSelect(id);
          }}
        />
      </PopoverContent>
    </Popover>
  );
});

function PresetList({
  listboxId,
  selected,
  onChoose,
}: {
  listboxId: string;
  selected: string;
  onChoose: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  // Defer filtering so typing stays responsive.
  const q = useDeferredValue(query.trim().toLowerCase());
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter within each group, dropping groups left empty. Match on label or id
  // so "vivendi", "dark", or "ef-fig" all work. `flatIndex` numbers the options
  // across group boundaries so arrow keys walk the whole list.
  const { groups, flat } = useMemo(() => {
    const filtered = !q
      ? PRESET_GROUPS
      : PRESET_GROUPS.map((group) => ({
          label: group.label,
          presets: group.presets.filter(
            (p) => p.label.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
          ),
        })).filter((group) => group.presets.length > 0);

    const flat: { id: string; label: string }[] = [];
    const groups = filtered.map((group) => ({
      label: group.label,
      presets: group.presets.map((p) => {
        flat.push(p);
        return { ...p, flatIndex: flat.length - 1 };
      }),
    }));
    return { groups, flat };
  }, [q]);

  // Clamp rather than reset on every render: typing shrinks the list, and an
  // index left past the end would highlight nothing.
  const activeIndex = flat.length === 0 ? -1 : Math.min(active, flat.length - 1);
  const activeId = activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined;

  const moveTo = useCallback((index: number) => {
    setActive(index);
    const row = listRef.current?.querySelector(`[data-option-index="${index}"]`);
    if (row instanceof HTMLElement && typeof row.scrollIntoView === "function") {
      row.scrollIntoView({ block: "nearest" });
    }
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (flat.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveTo((activeIndex + 1) % flat.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveTo((activeIndex - 1 + flat.length) % flat.length);
        break;
      case "Home":
        e.preventDefault();
        moveTo(0);
        break;
      case "End":
        e.preventDefault();
        moveTo(flat.length - 1);
        break;
      case "Enter": {
        const option = flat[activeIndex];
        if (!option) return;
        e.preventDefault();
        onChoose(option.id);
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
        aria-label="Search themes"
        placeholder="Search themes…"
        spellCheck={false}
        className="mb-1 h-8 text-xs"
      />
      <div className="max-h-72 overflow-auto">
        <div ref={listRef} id={listboxId} role="listbox" aria-label="Presets">
          {groups.map((group) => {
            const headerId = `${listboxId}-grp-${group.label.replaceAll(/\W+/g, "-")}`;
            return (
              <div key={group.label} role="group" aria-labelledby={headerId}>
                <div
                  id={headerId}
                  role="presentation"
                  className="text-muted-foreground px-2 pt-1.5 pb-0.5 text-[10px] font-medium tracking-wide uppercase"
                >
                  {group.label}
                </div>
                {group.presets.map((p) => (
                  <Option
                    key={p.id}
                    id={`${listboxId}-opt-${p.flatIndex}`}
                    index={p.flatIndex}
                    label={p.label}
                    selected={selected === p.id}
                    active={p.flatIndex === activeIndex}
                    onChoose={() => onChoose(p.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
        {groups.length === 0 ? (
          <div className="text-muted-foreground px-2 py-1.5 text-xs">No match.</div>
        ) : null}
      </div>
    </div>
  );
}

function Option({
  id,
  index,
  label,
  selected,
  active,
  onChoose,
}: {
  id: string;
  index: number;
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
      data-option-index={index}
      onClick={onChoose}
      className={cn(
        "hover:bg-accent flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs",
        selected && "bg-accent/60",
        active && "bg-accent",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("w-3 shrink-0", selected ? "opacity-100" : "opacity-0")}
      >
        ✓
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
