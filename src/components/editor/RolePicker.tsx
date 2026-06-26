// A single semantic-role editor row. A role points at either a named palette
// color (chosen from a searchable combobox), a raw hex, or "unspecified". The
// resolved swatch shows the effective color regardless of which kind the value is.

import { memo } from "react";

import { cn } from "~/lib/utils.ts";
import { type RoleKey } from "~/theme/palette-keys.ts";
import { isHex, UNSPECIFIED } from "~/theme/resolve.ts";
import type { MappingValue } from "~/theme/types.ts";
import { ColorCombobox, HEX_OPTION } from "./ColorCombobox.tsx";

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
  const selectedKey =
    value == null || value === UNSPECIFIED ? UNSPECIFIED : usingHex ? HEX_OPTION : value;
  const triggerLabel =
    value == null || value === UNSPECIFIED ? "unspecified" : usingHex ? "raw hex" : value;

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
      <span
        className="border-input size-6 shrink-0 rounded border"
        style={{ backgroundColor: resolved ?? "transparent" }}
        title={resolved ?? "unspecified"}
      />
      <span className="text-muted-foreground w-44 shrink-0 truncate font-mono text-xs" title={role}>
        {role}
      </span>
      <ColorCombobox
        triggerLabel={triggerLabel}
        swatch={resolved}
        selectedKey={selectedKey}
        ariaLabel={`${role} color`}
        onSelect={handleSelect}
      />
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
