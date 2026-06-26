// A single named-color editor row: native color picker swatch + hex Input.

import { memo, useId, useRef, useState } from "react";

import { Input } from "~/components/ui/input.tsx";
import { cn } from "~/lib/utils.ts";
import type { ColorKey } from "~/theme/palette-keys.ts";
import { isHex } from "~/theme/resolve.ts";

interface ColorFieldProps {
  colorKey: ColorKey;
  value: string | undefined;
  highlighted?: boolean;
  /** Receives (colorKey, hex) so callers can pass a stable store action. */
  onChange: (key: ColorKey, hex: string) => void;
}

// PERF: memoized so a doc change re-renders only the row whose value/highlight
// changed, not all ~190 palette rows. onChange takes the key so PaletteEditor can
// pass the stable `setColor` action directly (no per-row closure).
export const ColorField = memo(function ColorField({
  colorKey,
  value,
  highlighted,
  onChange,
}: ColorFieldProps) {
  const id = useId();
  const [text, setText] = useState(value ?? "");

  // A local draft lets the user type an intermediate, not-yet-valid hex like
  // "#12" without propagating it. When the external value changes (preset load or
  // a linked palette edit), resync the draft during render — tracked via a ref
  // (not state) so this is a plain "did the prop change since last render" check,
  // with no extra render pass and no effect.
  const lastValueRef = useRef(value);
  if (value !== lastValueRef.current) {
    lastValueRef.current = value;
    setText(value ?? "");
  }

  const valid = isHex(text);
  const pickerValue = isHex(value ?? "") && (value ?? "").length === 7 ? value! : "#000000";

  function commit(next: string) {
    setText(next);
    if (isHex(next)) onChange(colorKey, next);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded px-1 py-0.5",
        highlighted && "bg-primary/10 ring-primary/40 ring-1",
      )}
    >
      <input
        type="color"
        value={pickerValue}
        onChange={(e) => commit(e.target.value)}
        className="border-input size-6 shrink-0 cursor-pointer rounded border bg-transparent p-0"
        aria-label={`${colorKey} color picker`}
      />
      <label
        htmlFor={id}
        className="text-muted-foreground w-44 shrink-0 truncate font-mono text-xs"
        title={colorKey}
      >
        {colorKey}
      </label>
      <Input
        id={id}
        value={text}
        spellCheck={false}
        onChange={(e) => commit(e.target.value)}
        className={cn("h-7 w-28 font-mono text-xs", !valid && "border-destructive")}
      />
    </div>
  );
});
