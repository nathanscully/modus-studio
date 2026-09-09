import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
} from "./color-picker.tsx";

function renderArea(onValueChange = vi.fn()) {
  render(
    <ColorPicker inline value="#804020" onValueChange={onValueChange}>
      <ColorPickerContent>
        <ColorPickerArea />
        <ColorPickerFormatSelect />
      </ColorPickerContent>
    </ColorPicker>,
  );
  return { area: screen.getByRole("slider", { name: "Saturation and brightness" }), onValueChange };
}

describe("ColorPickerArea", () => {
  it("is focusable and describes its saturation/brightness", () => {
    const { area } = renderArea();

    expect(area).toHaveAttribute("tabindex", "0");
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 75%, brightness 50%");
  });

  it("moves saturation by 1% with an arrow key and 10% with shift", () => {
    const { area, onValueChange } = renderArea();

    fireEvent.keyDown(area, { key: "ArrowRight" });
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 76%, brightness 50%");

    fireEvent.keyDown(area, { key: "ArrowLeft", shiftKey: true });
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 66%, brightness 50%");

    expect(onValueChange).toHaveBeenCalled();
  });

  it("moves brightness with up/down and clamps at the ends via Home/End", () => {
    const { area } = renderArea();

    fireEvent.keyDown(area, { key: "ArrowUp" });
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 75%, brightness 51%");

    fireEvent.keyDown(area, { key: "ArrowDown", shiftKey: true });
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 75%, brightness 41%");

    fireEvent.keyDown(area, { key: "Home" });
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 0%, brightness 41%");

    fireEvent.keyDown(area, { key: "End" });
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 100%, brightness 41%");
  });
});

describe("ColorPickerFormatSelect", () => {
  it("labels its trigger", () => {
    renderArea();

    expect(screen.getByRole("combobox", { name: "Color format" })).toBeInTheDocument();
  });
});

describe("ColorPickerEyeDropper", () => {
  it("labels its button", () => {
    vi.stubGlobal(
      "EyeDropper",
      class {
        open() {
          return Promise.resolve({ sRGBHex: "#000000" });
        }
      },
    );

    render(
      <ColorPicker inline value="#804020">
        <ColorPickerContent>
          <ColorPickerEyeDropper />
        </ColorPickerContent>
      </ColorPicker>,
    );

    expect(screen.getByRole("button", { name: "Pick color from screen" })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
