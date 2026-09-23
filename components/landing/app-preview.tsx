import type { ReactNode } from "react";
import { Check, Circle, Luggage, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrowserFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-elevation-3",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-4 py-3">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="ml-3 hidden h-5 w-full max-w-[200px] rounded-full border border-border bg-background sm:block" />
      </div>
      {children}
    </div>
  );
}

type RowState = "packed" | "pending" | "with-me";

function PreviewRow({ label, state }: { label: string; state: RowState }) {
  return (
    <div className="flex items-center gap-2.5">
      {state === "packed" ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-packed-soft text-packed-soft-foreground">
          <Check className="size-3" aria-hidden="true" />
        </span>
      ) : (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
          <Circle className="size-2.5" aria-hidden="true" />
        </span>
      )}
      <span className="truncate text-sm text-foreground">{label}</span>
      {state === "with-me" && (
        <span className="ml-auto shrink-0 rounded-full bg-with-me-soft px-2 py-0.5 text-[11px] font-medium text-with-me-soft-foreground">
          With Me
        </span>
      )}
    </div>
  );
}

export function TripPreview() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Trip</p>
          <p className="truncate font-heading text-lg font-semibold text-foreground">
            Weekend in Lisbon
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">2 bags · 11 items</p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          62% packed
        </span>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[62%] rounded-full bg-packed" />
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <Luggage className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-foreground">Carry-on</span>
            <span className="ml-auto text-xs text-muted-foreground">3 of 5 packed</span>
          </div>
          <div className="mt-3 space-y-2">
            <PreviewRow label="T-shirts" state="packed" />
            <PreviewRow label="Toiletry bag" state="packed" />
            <PreviewRow label="Charger" state="pending" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-with-me-soft text-with-me-soft-foreground">
              <Wallet className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-foreground">With Me</span>
            <span className="ml-auto text-xs text-muted-foreground">2 items</span>
          </div>
          <div className="mt-3 space-y-2">
            <PreviewRow label="Passport" state="with-me" />
            <PreviewRow label="Phone" state="with-me" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChecklistPreview() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-heading text-base font-semibold text-foreground">Packing list</p>
        <span className="rounded-full bg-pending-soft px-2.5 py-1 text-xs font-medium text-pending-soft-foreground">
          3 left
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        <PreviewRow label="Passport" state="packed" />
        <PreviewRow label="T-shirts" state="packed" />
        <PreviewRow label="Toothbrush" state="packed" />
        <PreviewRow label="Charger" state="pending" />
        <PreviewRow label="Sunglasses" state="pending" />
        <PreviewRow label="Book" state="pending" />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex size-5 items-center justify-center rounded-full bg-warning-soft text-warning-soft-foreground">
          <Wallet className="size-3" aria-hidden="true" />
        </span>
        <span>2 items marked With Me stay with you</span>
      </div>
    </div>
  );
}
