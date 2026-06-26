// A single named-color editor row: a hex field with a clickable swatch on its
// left that opens the native OS color picker.

import { memo, useId, useRef, useState } from "react";

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
  const colorInputRef = useRef<HTMLInputElement | null>(null);
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
      <label
        htmlFor={id}
        className="text-muted-foreground w-44 shrink-0 truncate font-mono text-xs"
        title={colorKey}
      >
        {colorKey}
      </label>

      {/* The hex value field with a clickable swatch on its left edge: clicking
          the swatch opens the OS RGB/hex picker, the field accepts typed/pasted
          hex. The native <input type="color"> is visually hidden but still the
          actual picker — the swatch button forwards clicks to it. */}
      <div
        className={cn(
          "border-input focus-within:border-ring focus-within:ring-ring/50 flex h-7 w-32 items-center overflow-hidden rounded-md border bg-transparent focus-within:ring-[3px]",
          !valid && "border-destructive",
        )}
      >
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          title={`Pick ${colorKey} color`}
          aria-label={`Pick ${colorKey} color`}
          className="hover:opacity-80 h-full w-7 shrink-0 cursor-pointer border-r"
          style={{ backgroundColor: isHex(value ?? "") ? value : "transparent" }}
        />
        <input
          id={id}
          value={text}
          spellCheck={false}
          onChange={(e) => commit(e.target.value)}
          className="h-full w-full min-w-0 bg-transparent px-2 font-mono text-xs outline-none"
        />
        {/* The real picker — visually hidden, opened via the swatch button. */}
        <input
          ref={colorInputRef}
          type="color"
          value={pickerValue}
          onChange={(e) => commit(e.target.value)}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
        />
      </div>
    </div>
  );
});
