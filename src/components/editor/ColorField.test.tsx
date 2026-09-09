import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ColorField } from "./ColorField.tsx";

describe("ColorField", () => {
  it("does not emit a change on mount or on a rerender with the same value", () => {
    const onChange = vi.fn();

    const { rerender } = render(
      <ColorField colorKey="bg-alt" value="#efd3e4" onChange={onChange} />,
    );

    expect(onChange).not.toHaveBeenCalled();

    rerender(<ColorField colorKey="bg-alt" value="#efd3e4" onChange={onChange} />);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not emit a change when the value prop changes externally", () => {
    const onChange = vi.fn();

    const { rerender } = render(
      <ColorField colorKey="bg-alt" value="#efd3e4" onChange={onChange} />,
    );
    rerender(<ColorField colorKey="bg-alt" value="#f0d3e4" onChange={onChange} />);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the hex value for a defined color", () => {
    render(<ColorField colorKey="bg-alt" value="#efd3e4" onChange={vi.fn()} />);

    expect(screen.getByText("#efd3e4")).toBeInTheDocument();
    expect(screen.queryByText("not set")).not.toBeInTheDocument();
  });

  it("shows an unset row for an undefined color and emits nothing", () => {
    const onChange = vi.fn();

    render(<ColorField colorKey="red-intense" value={undefined} onChange={onChange} />);

    expect(screen.getByText("not set")).toBeInTheDocument();
    expect(screen.getByLabelText("Set red-intense color (not set)")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
