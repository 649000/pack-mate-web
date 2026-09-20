"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Columns3, ListChecks, MapPin, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { EmptyState } from "@/components/empty-state";
import { RecordAction } from "@/components/record-action";
import { ListSearchToolbar } from "@/components/list-search";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridColumnVisibility } from "@/components/ui/data-grid-column-visibility";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, inputVariants } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
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
import { COUNTRIES, formatDestination } from "@/lib/countries";
import { createTrip, deleteTrip, listTrips, updateTrip } from "@/lib/data";
import { filterByName } from "@/lib/packing";
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
  const [destination, setDestination] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

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
    setDestination("");
    setCountryCode("");
    setStartDate("");
    setEndDate("");
    setEditorOpen(true);
  }

  const openEdit = useCallback((trip: Trip) => {
    setEditing(trip);
    setName(trip.name);
    setDestination(trip.destination ?? "");
    setCountryCode(trip.country_code);
    setStartDate(trip.start_date ?? "");
    setEndDate(trip.end_date ?? "");
    setEditorOpen(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!countryCode) {
      toast.error("Select a country");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: validateName(name, "Trip name"),
        destination: destination.trim() || null,
        countryCode,
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

  const visibleTrips = filterByName(trips, query);

  const columns = useMemo<ColumnDef<Trip>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        meta: { headerTitle: "Trip" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Trip" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
              <MapPin className="size-4" aria-hidden="true" />
            </span>
            <Link href={`/trip?id=${row.original.id}`} className="font-medium hover:text-primary">
              {row.original.name}
            </Link>
          </div>
        ),
      },
      {
        id: "destination",
        accessorFn: (trip) => formatDestination(trip.destination, trip.country_code) ?? "",
        meta: {
          headerTitle: "Destination",
          headerClassName: "hidden sm:table-cell",
          cellClassName: "hidden sm:table-cell",
        },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Destination" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDestination(row.original.destination, row.original.country_code)}
          </span>
        ),
      },
      {
        id: "dates",
        accessorFn: (trip) => formatDates(trip),
        meta: {
          headerTitle: "Dates",
          headerClassName: "hidden sm:table-cell",
          cellClassName: "hidden sm:table-cell",
        },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Dates" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDates(row.original)}</span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <RecordAction icon={Pencil} label="Edit" onClick={() => openEdit(row.original)} />
            <RecordAction
              icon={Trash2}
              label="Delete"
              onClick={() => setPendingDelete(row.original)}
            />
          </div>
        ),
      },
    ],
    [openEdit],
  );

  const table = useReactTable({
    data: visibleTrips,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Trips"
        description="What you are bringing, per trip."
        breadcrumb={[{ label: "Packing" }, { label: "Trips" }]}
      >
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" />
          New trip
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>All trips</CardTitle>
            <CardDescription>
              {trips.length} {trips.length === 1 ? "trip" : "trips"}
            </CardDescription>
          </CardHeading>
          {!loading && trips.length > 0 ? (
            <CardToolbar>
              <ListSearchToolbar
                id="trip-search"
                label="Search trips"
                value={query}
                onChange={setQuery}
                placeholder="Search trips"
              />
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button variant="outline" size="sm">
                    <Columns3 aria-hidden="true" />
                    Columns
                  </Button>
                }
              />
            </CardToolbar>
          ) : null}
        </CardHeader>
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No trips yet"
            description="Create a trip to start building its packing list."
            action={
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" />
                Create your first trip
              </Button>
            }
          />
        ) : visibleTrips.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={`No trips match “${query}”.`}
            description="Try a different search term."
          />
        ) : (
          <DataGrid table={table} recordCount={visibleTrips.length} tableLayout={{ width: "auto" }}>
            <div className="overflow-x-auto">
              <DataGridTable />
            </div>
          </DataGrid>
        )}
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit trip" : "New trip"}</DialogTitle>
              <DialogDescription>
                Give your trip a name, a country and optional dates.
              </DialogDescription>
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trip-country">Country</Label>
                <select
                  id="trip-country"
                  value={countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                  className={cn(inputVariants({ variant: "md" }), "pr-8")}
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trip-destination">Destination</Label>
                <Input
                  id="trip-destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="City or place (optional)"
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
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
      <TripsView />
    </Suspense>
  );
}
