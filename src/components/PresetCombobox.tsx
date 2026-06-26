// A searchable, grouped combobox for picking the base preset.
//
// Replaces the Radix <Select> in the toolbar: with 40 presets (2 Modus + 38
// ef-themes) a plain dropdown is tedious to scan, so this filters as you type
// while preserving the family grouping (Modus / Ef — light / Ef — dark). The
// preset list is small, so unlike ColorCombobox there's no need to cap rows —
// every match renders, group headers and all.

import { memo, useDeferredValue, useMemo, useState } from "react";

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label="Base preset"
          className="w-52 justify-between text-xs font-normal"
        >
          <span className="truncate">{labelFor(value)}</span>
          <span className="text-muted-foreground ml-2 shrink-0 opacity-70">▾</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        {/* Mounted only while open. */}
        <PresetList
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

function PresetList({ selected, onChoose }: { selected: string; onChoose: (id: string) => void }) {
  const [query, setQuery] = useState("");
  // Defer filtering so typing stays responsive.
  const q = useDeferredValue(query.trim().toLowerCase());

  // Filter within each group, dropping groups left empty. Match on label or id
  // so "vivendi", "dark", or "ef-fig" all work.
  const groups = useMemo(() => {
    if (!q) return PRESET_GROUPS;
    return PRESET_GROUPS.map((group) => ({
      label: group.label,
      presets: group.presets.filter(
        (p) => p.label.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
      ),
    })).filter((group) => group.presets.length > 0);
  }, [q]);

  return (
    <div>
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search themes…"
        spellCheck={false}
        className="mb-1 h-8 text-xs"
      />
      <div className="max-h-72 overflow-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="text-muted-foreground px-2 pt-1.5 pb-0.5 text-[10px] font-medium tracking-wide uppercase">
              {group.label}
            </div>
            {group.presets.map((p) => (
              <Option
                key={p.id}
                label={p.label}
                selected={selected === p.id}
                onChoose={() => onChoose(p.id)}
              />
            ))}
          </div>
        ))}
        {groups.length === 0 ? (
          <div className="text-muted-foreground px-2 py-1.5 text-xs">No match.</div>
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
        "hover:bg-accent flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs",
        selected && "bg-accent/60",
      )}
    >
      <span className={cn("w-3 shrink-0", selected ? "opacity-100" : "opacity-0")}>✓</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
