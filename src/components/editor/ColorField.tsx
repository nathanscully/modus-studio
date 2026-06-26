// A single named-color editor row. Shows a swatch + the hex value; clicking
// either opens a rich color picker (diceui / radix) pre-populated with the
// current color. Clicking the hex text opens the picker with its hex input
// focused, so a paste immediately overwrites the value.

import { memo, useId, useRef } from "react";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
  parseColorString,
  rgbToHex,
} from "~/components/ui/color-picker.tsx";
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

/** Normalize a stored value to a 7-char hex the picker can parse, or a default. */
function toPickerHex(value: string | undefined): string {
  if (value && isHex(value)) return value.slice(0, 7); // drop any alpha
  return "#000000";
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
  // When true, focus the picker's hex input as soon as the popup opens (set when
  // the user opens via the hex text, so a paste overwrites it immediately).
  const focusInputOnOpen = useRef(false);

  const hex = toPickerHex(value);
  const valid = value == null || isHex(value);

  // The picker emits the value in whatever format is selected (hex / rgb(...) /
  // hsl(...) / hsb(...)). Normalize any of them to a hex string for the store,
  // which only deals in hex.
  const handleValueChange = (next: string) => {
    if (isHex(next)) {
      onChange(colorKey, next);
      return;
    }
    const parsed = parseColorString(next);
    if (parsed) onChange(colorKey, rgbToHex(parsed));
  };

  const handleOpenChange = (open: boolean) => {
    if (open && focusInputOnOpen.current) {
      focusInputOnOpen.current = false;
      // Focus + select the picker's hex input once the popover content mounts.
      // The content renders in a portal, so query it by data-slot from document.
      // The diceui HexInput is labelled "Hex color value".
      requestAnimationFrame(() => {
        const content = document.querySelector('[data-slot="color-picker-content"]');
        const input =
          content?.querySelector<HTMLInputElement>('input[aria-label="Hex color value"]') ??
          content?.querySelector<HTMLInputElement>("input");
        input?.focus();
        input?.select();
      });
    }
  };

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

      <ColorPicker value={hex} onValueChange={handleValueChange} onOpenChange={handleOpenChange}>
        <div
          className={cn(
            "border-input focus-within:border-ring focus-within:ring-ring/50 flex h-7 w-32 items-center overflow-hidden rounded-md border bg-transparent focus-within:ring-[3px]",
            !valid && "border-destructive",
          )}
        >
          {/* Swatch opens the picker on the area/sliders. */}
          <ColorPickerTrigger asChild>
            <button
              type="button"
              title={`Pick ${colorKey} color`}
              aria-label={`Pick ${colorKey} color`}
              className="h-full w-7 shrink-0 cursor-pointer border-r hover:opacity-80"
            >
              <ColorPickerSwatch className="h-full w-full rounded-none border-0" />
            </button>
          </ColorPickerTrigger>

          {/* Hex text opens the picker with its hex input focused, so a paste
              overwrites the value quickly. */}
          <ColorPickerTrigger asChild>
            <button
              id={id}
              type="button"
              onClick={() => {
                focusInputOnOpen.current = true;
              }}
              title={`Edit ${colorKey} hex`}
              aria-label={`Edit ${colorKey} hex`}
              className="h-full w-full min-w-0 cursor-text px-2 text-left font-mono text-xs"
            >
              {value ?? ""}
            </button>
          </ColorPickerTrigger>
        </div>

        <ColorPickerContent className="w-64">
          <ColorPickerArea />
          <ColorPickerHueSlider />
          {/* Format select (HEX/RGB/HSL/HSB) + the matching input(s). The eye
              dropper sits alongside. ColorPickerInput renders one field for hex
              and grouped fields for rgb/hsl/hsb based on the selected format. */}
          <div className="flex items-center gap-2">
            <ColorPickerEyeDropper />
            <ColorPickerFormatSelect className="w-20 shrink-0" />
            <ColorPickerInput withoutAlpha className="min-w-0 flex-1" />
          </div>
        </ColorPickerContent>
      </ColorPicker>
    </div>
  );
});
