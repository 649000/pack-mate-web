"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inputVariants } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Trip } from "@/lib/types";

// Shared by the item and bag libraries: pick one of the user's trips and add
// the chosen record to it. Adding happens unassigned; the trip screen places it.
export function AddToTripDialog({
  open,
  onOpenChange,
  trips,
  subject,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trips: Trip[];
  subject: string;
  onAdd: (tripId: string) => void | Promise<void>;
}) {
  const [tripId, setTripId] = useState("");
  const [busy, setBusy] = useState(false);
  // Fall back to the first trip so the control is never empty when trips exist.
  const selectedTripId = tripId || trips[0]?.id || "";

  function close(next: boolean) {
    if (!next) setTripId("");
    onOpenChange(next);
  }

  async function submit() {
    if (!selectedTripId) return;
    setBusy(true);
    try {
      await onAdd(selectedTripId);
      close(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to trip</DialogTitle>
          <DialogDescription>
            {trips.length === 0
              ? "Create a trip first, then you can add this to it."
              : `Add “${subject}” to one of your trips. You can place it on the trip afterwards.`}
          </DialogDescription>
        </DialogHeader>
        {trips.length > 0 ? (
          <div className="flex flex-col gap-1.5 py-2">
            <Label htmlFor="add-to-trip-select">Trip</Label>
            <select
              id="add-to-trip-select"
              className={cn(inputVariants({ variant: "md" }), "pr-8")}
              value={selectedTripId}
              onChange={(event) => setTripId(event.target.value)}
            >
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || trips.length === 0} onClick={() => void submit()}>
            {busy ? "Adding..." : "Add to trip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
