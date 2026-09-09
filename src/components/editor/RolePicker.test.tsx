import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ThemeStoreProvider } from "~/state/theme-store.tsx";
import "~/theme/loader.ts";
import { RolePicker } from "./RolePicker.tsx";

function renderRow(ui: React.ReactElement) {
  return render(<ThemeStoreProvider initialPresetId="modus-operandi">{ui}</ThemeStoreProvider>);
}

describe("RolePicker", () => {
  it("shows the inherited swatch for an unspecified wave-underline role", () => {
    renderRow(
      <RolePicker role="underline-err" value={undefined} resolved={null} onChange={vi.fn()} />,
    );

    const swatch = screen.getByTestId("inherited-swatch");
    expect(swatch.getAttribute("title")).toMatch(/^inherits modus core /);
  });

  it("does not claim inheritance for a role with no backfill", () => {
    renderRow(<RolePicker role="keybind" value="unspecified" resolved={null} onChange={vi.fn()} />);

    expect(screen.queryByTestId("inherited-swatch")).not.toBeInTheDocument();
    expect(screen.getByTitle("unspecified")).toBeInTheDocument();
  });

  it("keeps the plain resolved swatch for a specified role", () => {
    renderRow(
      <RolePicker role="cursor" value="blue-cooler" resolved="#0000b0" onChange={vi.fn()} />,
    );

    expect(screen.queryByTestId("inherited-swatch")).not.toBeInTheDocument();
    expect(screen.getByTitle("#0000b0")).toBeInTheDocument();
  });
});
