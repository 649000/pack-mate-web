"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PdfMode, PdfViewModel } from "@/lib/pdf";

export const PDF_MODE_OPTIONS = [
  {
    value: "blank",
    label: "Blank sheet",
    description: "Every box empty, ready to tick by hand.",
  },
  {
    value: "packed",
    label: "Tick packed items",
    description: "Items already marked packed in the app start ticked.",
  },
] as const satisfies readonly { value: PdfMode; label: string; description: string }[];

export type PdfExporter = (model: PdfViewModel) => Promise<void>;

async function defaultExporter(model: PdfViewModel): Promise<void> {
  const { downloadTripPdf } = await import("@/components/packing/trip-pdf");
  await downloadTripPdf(model);
}

export function ExportPdfDialog({
  open,
  onOpenChange,
  buildModel,
  exporter = defaultExporter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildModel: (mode: PdfMode) => PdfViewModel;
  exporter?: PdfExporter;
}) {
  const [mode, setMode] = useState<PdfMode>("blank");
  const [busy, setBusy] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) setMode("blank");
    onOpenChange(next);
  }

  async function handleExport() {
    setBusy(true);
    try {
      await exporter(buildModel(mode));
      handleOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create the PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download PDF</DialogTitle>
          <DialogDescription>A printable checklist you can tick off with a pen.</DialogDescription>
        </DialogHeader>
        <fieldset className="flex flex-col gap-3 py-4">
          <legend className="sr-only">What to include</legend>
          {PDF_MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-input p-3"
            >
              <input
                type="radio"
                name="pdf-mode"
                value={option.value}
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleExport()} disabled={busy}>
            {busy ? "Preparing..." : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
