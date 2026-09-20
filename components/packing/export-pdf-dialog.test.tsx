import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { PdfMode, PdfViewModel } from "@/lib/pdf";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { ExportPdfDialog, type PdfExporter } from "./export-pdf-dialog";

const base: PdfViewModel = {
  tripName: "Iceland 2026",
  location: null,
  dates: "2026-06-03 to 2026-06-12",
  packed: 1,
  total: 2,
  bags: [],
  withMe: [],
  loose: [],
  isEmpty: false,
};

function buildModel(mode: PdfMode): PdfViewModel {
  return { ...base, tripName: mode };
}

function blankRadio() {
  return screen.getByRole("radio", { name: /blank sheet/i });
}

function packedRadio() {
  return screen.getByRole("radio", { name: /tick packed items/i });
}

function downloadButton() {
  return screen.getByRole("button", { name: /^download$/i });
}

function Harness({ exporter }: { exporter: PdfExporter }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        reopen
      </button>
      <ExportPdfDialog
        open={open}
        onOpenChange={setOpen}
        buildModel={buildModel}
        exporter={exporter}
      />
    </>
  );
}

describe("ExportPdfDialog", () => {
  it("preselects the blank sheet", () => {
    render(
      <ExportPdfDialog open onOpenChange={() => {}} buildModel={buildModel} exporter={vi.fn()} />,
    );

    expect(blankRadio()).toBeChecked();
    expect(packedRadio()).not.toBeChecked();
  });

  it("lets the owner choose to tick packed items", async () => {
    const user = userEvent.setup();
    render(
      <ExportPdfDialog open onOpenChange={() => {}} buildModel={buildModel} exporter={vi.fn()} />,
    );

    await user.click(packedRadio());

    expect(packedRadio()).toBeChecked();
    expect(blankRadio()).not.toBeChecked();
  });

  it("exports a blank sheet by default", async () => {
    const user = userEvent.setup();
    const exporter = vi.fn(async () => {});
    render(
      <ExportPdfDialog open onOpenChange={() => {}} buildModel={buildModel} exporter={exporter} />,
    );

    await user.click(downloadButton());

    await waitFor(() => expect(exporter).toHaveBeenCalledTimes(1));
    expect(exporter).toHaveBeenCalledWith(expect.objectContaining({ tripName: "blank" }));
  });

  it("exports with the selected mode", async () => {
    const user = userEvent.setup();
    const exporter = vi.fn(async () => {});
    render(
      <ExportPdfDialog open onOpenChange={() => {}} buildModel={buildModel} exporter={exporter} />,
    );

    await user.click(packedRadio());
    await user.click(downloadButton());

    await waitFor(() => expect(exporter).toHaveBeenCalledTimes(1));
    expect(exporter).toHaveBeenCalledWith(expect.objectContaining({ tripName: "packed" }));
  });

  it("closes after a successful export", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ExportPdfDialog
        open
        onOpenChange={onOpenChange}
        buildModel={buildModel}
        exporter={vi.fn(async () => {})}
      />,
    );

    await user.click(downloadButton());

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("reports a failure without closing", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const exporter = vi.fn(async () => {
      throw new Error("boom");
    });
    render(
      <ExportPdfDialog
        open
        onOpenChange={onOpenChange}
        buildModel={buildModel}
        exporter={exporter}
      />,
    );

    await user.click(downloadButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("boom"));
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("resets to the blank sheet when reopened", async () => {
    const user = userEvent.setup();
    render(<Harness exporter={vi.fn(async () => {})} />);

    await user.click(packedRadio());
    expect(packedRadio()).toBeChecked();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await user.click(screen.getByRole("button", { name: /reopen/i }));

    await waitFor(() => expect(blankRadio()).toBeChecked());
  });
});
