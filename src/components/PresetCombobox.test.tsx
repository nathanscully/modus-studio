import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PresetCombobox } from "./PresetCombobox.tsx";
import { PRESET_GROUPS } from "~/theme/presets.ts";

const FLAT_PRESETS = PRESET_GROUPS.flatMap((g) => g.presets);

function setup() {
  const onSelect = vi.fn();
  render(<PresetCombobox value="modus-operandi" onSelect={onSelect} />);
  const trigger = screen.getByRole("combobox", { name: "Base preset" });
  return { onSelect, trigger };
}

function openList(trigger: HTMLElement) {
  fireEvent.click(trigger);
  return screen.getByRole("combobox", { name: "Search themes" });
}

describe("PresetCombobox", () => {
  it("selects the highlighted option with arrow keys and Enter", () => {
    const { onSelect, trigger } = setup();
    const search = openList(trigger);

    const options = screen.getAllByRole("option");
    expect(search).toHaveFocus();
    expect(search).toHaveAttribute("aria-activedescendant", options[0]?.id);

    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(search).toHaveAttribute("aria-activedescendant", options[2]?.id);
    expect(options[2]).toHaveClass("bg-accent");

    fireEvent.keyDown(search, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(FLAT_PRESETS[2]?.id);
  });

  it("walks the highlight across group boundaries", () => {
    const { onSelect, trigger } = setup();
    const search = openList(trigger);

    // The first group is Modus (2 presets), so three downs land in the next group.
    fireEvent.keyDown(search, { key: "End" });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(FLAT_PRESETS.at(-1)?.id);
  });

  it("marks the current value with aria-selected", () => {
    const { trigger } = setup();
    openList(trigger);

    const selected = screen.getAllByRole("option").filter((o) => o.ariaSelected === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent(FLAT_PRESETS[0]?.label ?? "");
  });

  it("labels each group from its header", () => {
    const { trigger } = setup();
    openList(trigger);

    const groups = screen.getAllByRole("group");
    expect(groups.length).toBe(PRESET_GROUPS.length);
    for (const [i, group] of groups.entries()) {
      const headerId = group.getAttribute("aria-labelledby");
      expect(headerId).toBeTruthy();
      expect(document.getElementById(headerId ?? "")).toHaveTextContent(
        PRESET_GROUPS[i]?.label ?? "",
      );
    }
  });

  it("resets the highlight to the first match when typing", async () => {
    const { onSelect, trigger } = setup();
    const search = openList(trigger);

    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowDown" });

    await act(async () => {
      fireEvent.change(search, { target: { value: "vivendi" } });
    });

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(search).toHaveAttribute("aria-activedescendant", options[0]?.id);

    fireEvent.keyDown(search, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("modus-vivendi");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const { onSelect, trigger } = setup();
    const search = openList(trigger);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(search, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
