"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createTrip, deleteTrip, listTrips, updateTrip } from "@/lib/data";
import type { Trip } from "@/lib/types";
import { validateName } from "@/lib/validation";

function formatDates(trip: Trip): string {
  if (!trip.start_date && !trip.end_date) return "No dates";
  if (trip.start_date && trip.end_date) return `${trip.start_date} to ${trip.end_date}`;
  return trip.start_date ?? trip.end_date ?? "No dates";
}

export function TripsView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);

  function refresh() {
    return listTrips()
      .then((data) => {
        setTrips(data);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load trips");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    void refresh();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setStartDate("");
    setEndDate("");
    setEditorOpen(true);
  }

  function openEdit(trip: Trip) {
    setEditing(trip);
    setName(trip.name);
    setStartDate(trip.start_date ?? "");
    setEndDate(trip.end_date ?? "");
    setEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: validateName(name, "Trip name"),
        startDate: startDate || null,
        endDate: endDate || null,
      };
      if (editing) {
        await updateTrip(editing.id, payload);
        toast.success("Trip updated");
      } else {
        await createTrip(payload);
        toast.success("Trip created");
      }
      setEditorOpen(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save trip");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteTrip(pendingDelete.id);
      toast.success("Trip deleted");
      setPendingDelete(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete trip");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Trips"
        description="What you are bringing, per trip."
        breadcrumb={[{ label: "Packing" }, { label: "Trips" }]}
      >
        <Button onClick={openCreate}>New trip</Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>All trips</CardTitle>
            <CardDescription>
              {trips.length} {trips.length === 1 ? "trip" : "trips"}
            </CardDescription>
          </CardHeading>
        </CardHeader>
        <CardTable>
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : trips.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No trips yet. Create your first one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead className="hidden sm:table-cell">Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <Link href={`/trip?id=${trip.id}`} className="font-medium hover:text-primary">
                        {trip.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDates(trip)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => openEdit(trip)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPendingDelete(trip)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardTable>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit trip" : "New trip"}</DialogTitle>
              <DialogDescription>Give your trip a name and optional dates.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trip-name">Name</Label>
                <Input
                  id="trip-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="trip-start">Start date</Label>
                  <Input
                    id="trip-start"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="trip-end">End date</Label>
                  <Input
                    id="trip-end"
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &ldquo;{pendingDelete?.name}&rdquo; and its packing list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TripsPage() {
  return <TripsView />;
}
