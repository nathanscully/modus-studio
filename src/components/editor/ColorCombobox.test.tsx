import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ColorCombobox } from "./ColorCombobox.tsx";

function setup() {
  const onSelect = vi.fn();
  render(
    <ColorCombobox
      triggerLabel="unspecified"
      swatch={null}
      selectedKey="unspecified"
      ariaLabel="Pick a color"
      onSelect={onSelect}
    />,
  );
  const trigger = screen.getByRole("combobox", { name: "Pick a color" });
  return { onSelect, trigger };
}

function openList(trigger: HTMLElement) {
  fireEvent.click(trigger);
  return screen.getByRole("combobox", { name: "Search color" });
}

// The deferred filter runs in a transition, so flush it before asserting.
async function typeSearch(search: HTMLElement, value: string) {
  await act(async () => {
    fireEvent.change(search, { target: { value } });
  });
}

function labelOf(option: HTMLElement | undefined) {
  return option?.textContent?.replace("✓", "").trim();
}

describe("ColorCombobox", () => {
  it("selects the highlighted option with arrow keys and Enter", async () => {
    const { onSelect, trigger } = setup();
    const search = openList(trigger);

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(search).toHaveFocus();
    expect(search).toHaveAttribute("aria-activedescendant", options[0]?.id);

    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(search).toHaveAttribute("aria-activedescendant", options[2]?.id);
    expect(options[2]).toHaveClass("bg-accent");

    const third = labelOf(options[2]);
    fireEvent.keyDown(search, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(third);
  });

  it("wraps the highlight and jumps with Home/End", () => {
    const { trigger } = setup();
    const search = openList(trigger);
    const options = screen.getAllByRole("option");

    fireEvent.keyDown(search, { key: "ArrowUp" });
    expect(search).toHaveAttribute("aria-activedescendant", options.at(-1)?.id);

    fireEvent.keyDown(search, { key: "Home" });
    expect(search).toHaveAttribute("aria-activedescendant", options[0]?.id);

    fireEvent.keyDown(search, { key: "End" });
    expect(search).toHaveAttribute("aria-activedescendant", options.at(-1)?.id);
  });

  it("resets the highlight to the first match when typing", async () => {
    const { onSelect, trigger } = setup();
    const search = openList(trigger);

    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowDown" });

    await typeSearch(search, "blue-warmer");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(search).toHaveAttribute("aria-activedescendant", options[0]?.id);

    fireEvent.keyDown(search, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("blue-warmer");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const { onSelect, trigger } = setup();
    const search = openList(trigger);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(search, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Radix restores focus after the content unmounts, one task later.
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("wires the trigger and search input to the listbox id", () => {
    const { trigger } = setup();
    const search = openList(trigger);
    const listbox = screen.getByRole("listbox");

    expect(trigger).toHaveAttribute("aria-controls", listbox.id);
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(search).toHaveAttribute("aria-controls", listbox.id);
    expect(search).toHaveAttribute("aria-autocomplete", "list");
  });

  it("still selects on click", () => {
    const { onSelect, trigger } = setup();
    openList(trigger);

    const target = screen.getAllByRole("option")[1];
    if (!target) throw new Error("expected a second option");
    fireEvent.click(target);

    expect(onSelect).toHaveBeenCalledWith("__hex__");
  });
});
