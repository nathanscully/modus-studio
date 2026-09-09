// A single semantic-role editor row. A role points at either a named palette
// color (chosen from a searchable combobox), a raw hex, or "unspecified". The
// resolved swatch shows the effective color regardless of which kind the value is.
//
// "unspecified" is not always inert: the elisp export backfills some roles (see
// export-el.ts) — a name the theme happens to define in its PALETTE (the
// ef-themes define `cursor` that way), and the wave-underline roles from the
// Modus core mappings. Such a row shows the greyed "unspecified" value AND the
// color the engine will actually use, labelled with where it comes from.

import { memo } from "react";

import { useThemeStore } from "~/state/theme-store.tsx";
import { cn } from "~/lib/utils.ts";
import { type RoleKey } from "~/theme/palette-keys.ts";
import { isHex, resolveValue, UNSPECIFIED } from "~/theme/resolve.ts";
import { getModusCore } from "~/theme/theme-file.ts";
import type { MappingValue, ThemeDoc } from "~/theme/types.ts";
import { ColorCombobox, HEX_OPTION } from "./ColorCombobox.tsx";

const WAVE_UNDERLINE_ROLES: ReadonlySet<string> = new Set([
  "underline-err",
  "underline-warning",
  "underline-note",
]);

interface Inherited {
  hex: string;
  /** Where the effective color comes from, for the swatch title. */
  source: string;
}

/**
 * Mirror the export's backfill for a role the doc leaves unspecified. Returns
 * null when the export would emit a bare `unspecified` too.
 */
function inheritedFor(doc: ThemeDoc, role: RoleKey): Inherited | null {
  const fromPalette = (doc.palette as Record<string, string | undefined>)[role];
  if (fromPalette && isHex(fromPalette)) {
    return { hex: fromPalette, source: `palette ${role}` };
  }

  if (!WAVE_UNDERLINE_ROLES.has(role)) return null;

  // getModusCore throws until the loader registers the cores; a missing swatch
  // is not worth breaking the editor over.
  let core: ThemeDoc;
  try {
    core = getModusCore(doc.meta.mode);
  } catch {
    return null;
  }

  const coreValue = core.mappings[role];
  if (coreValue == null || coreValue === UNSPECIFIED) return null;
  const hex = resolveValue(core, coreValue);
  if (!hex) return null;
  return { hex, source: `modus core ${coreValue}` };
}

/**
 * Rendered only for an unspecified role, so reading the store here does not
 * re-render the ~130 specified rows on every edit (RolePicker itself stays
 * memoized on primitive props).
 */
function InheritedSwatch({ role }: { role: RoleKey }) {
  const { doc } = useThemeStore();
  const inherited = inheritedFor(doc, role);

  if (!inherited) {
    return <span className="border-input size-6 shrink-0 rounded border" title="unspecified" />;
  }

  return (
    <span
      className="border-input size-6 shrink-0 rounded border"
      style={{ backgroundColor: inherited.hex }}
      title={`inherits ${inherited.source} (${inherited.hex})`}
      data-testid="inherited-swatch"
    />
  );
}

interface RolePickerProps {
  role: RoleKey;
  /** This role's current mapping value (the raw layer-2 value). */
  value: MappingValue | undefined;
  /** The value resolved to a concrete hex for the swatch, or null. */
  resolved: string | null;
  highlighted?: boolean;
  /** Receives (role, value) so callers can pass a stable store action directly. */
  onChange: (role: RoleKey, value: MappingValue) => void;
}

// PERF: memoized so a doc change only re-renders the ONE row whose value (or
// highlight/resolved swatch) actually changed — not all ~130 rows. Props are
// primitives + a stable onChange, so React.memo's shallow compare is effective.
export const RolePicker = memo(function RolePicker({
  role,
  value,
  resolved,
  highlighted,
  onChange,
}: RolePickerProps) {
  const usingHex = value != null && isHex(value);
  const unspecified = value == null || value === UNSPECIFIED;
  const selectedKey = unspecified ? UNSPECIFIED : usingHex ? HEX_OPTION : value;
  const triggerLabel = unspecified ? "unspecified" : usingHex ? "raw hex" : value;

  function handleSelect(v: string) {
    if (v === HEX_OPTION) onChange(role, isHex(value ?? "") ? value! : "#000000");
    else onChange(role, v);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded px-1 py-0.5",
        highlighted && "bg-primary/10 ring-primary/40 ring-1",
      )}
    >
      {unspecified ? (
        <InheritedSwatch role={role} />
      ) : (
        <span
          className="border-input size-6 shrink-0 rounded border"
          style={{ backgroundColor: resolved ?? "transparent" }}
          title={resolved ?? "unspecified"}
        />
      )}
      <span className="text-muted-foreground w-44 shrink-0 truncate font-mono text-xs" title={role}>
        {role}
      </span>
      {/* Greys the trigger label for an unspecified role without ColorCombobox
          needing to know about it. */}
      <span className={cn(unspecified && "[&_button]:text-muted-foreground")}>
        <ColorCombobox
          triggerLabel={triggerLabel}
          swatch={resolved}
          selectedKey={selectedKey}
          ariaLabel={`${role} color`}
          onSelect={handleSelect}
        />
      </span>
      {usingHex ? (
        <input
          type="color"
          value={isHex(value!) && value!.length === 7 ? value! : "#000000"}
          onChange={(e) => onChange(role, e.target.value)}
          className="border-input size-6 shrink-0 cursor-pointer rounded border bg-transparent p-0"
          aria-label={`${role} hex picker`}
        />
      ) : null}
    </div>
  );
});
