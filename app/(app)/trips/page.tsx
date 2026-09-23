"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  Copy,
  History,
  ListChecks,
  MapPin,
  Pencil,
  Plane,
  Plus,
  SearchX,
  Sparkles,
  Trash2,
  Weight,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RecordAction } from "@/components/record-action";
import { ListSearchToolbar } from "@/components/list-search";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CountryFlag } from "@/components/ui/country-flag";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
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
import {
  createTrip,
  deleteTrip,
  duplicateTrip,
  getProfile,
  listTripBags,
  listTripEntries,
  listTrips,
  updateTrip,
} from "@/lib/data";
import { duplicateTripDefaults } from "@/lib/trip-duplicate";
import { filterByName, packingProgress } from "@/lib/packing";
import { departureCountdown, type DepartureCountdown } from "@/lib/trip-status";
import { formatWeight, tripBaggageTotal } from "@/lib/weight";
import type { DisplayWeightUnit, Trip, TripBag, TripEntry } from "@/lib/types";
import { validateName } from "@/lib/validation";

type TripView = "all" | "upcoming" | "past";
type TripSort = "departure" | "name";

function formatDates(trip: Trip): string {
  if (!trip.start_date && !trip.end_date) return "No dates";
  if (trip.start_date && trip.end_date) return `${trip.start_date} to ${trip.end_date}`;
  return trip.start_date ?? trip.end_date ?? "No dates";
}

function countdownLabel(countdown: DepartureCountdown): string | null {
  switch (countdown.kind) {
    case "before":
      return countdown.days === 1 ? "1 day to departure" : `${countdown.days} days to departure`;
    case "today":
      return "Leaving today";
    case "inProgress":
      return countdown.total !== null
        ? `Day ${countdown.day} of ${countdown.total}`
        : "In progress";
    default:
      return null;
  }
}

function tripStatus(trip: Trip): { label: string; status: "packed" | "withMe" | "pending" } {
  switch (departureCountdown(trip.start_date, trip.end_date).kind) {
    case "before":
    case "today":
      return { label: "Upcoming", status: "withMe" };
    case "inProgress":
      return { label: "In progress", status: "packed" };
    case "ended":
      return { label: "Completed", status: "pending" };
    default:
      return { label: "No dates", status: "pending" };
  }
}

function isPast(trip: Trip): boolean {
  return departureCountdown(trip.start_date, trip.end_date).kind === "ended";
}

function startValue(trip: Trip): string {
  return trip.start_date ?? "9999-12-31";
}

function TripCard({
  trip,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDuplicate: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}) {
  const past = isPast(trip);
  const status = tripStatus(trip);
  const href = `/trip?id=${trip.id}`;
  const destination = formatDestination(trip.destination, trip.country_code);

  return (
    <Card className="relative flex flex-col justify-between transition-shadow hover:shadow-elevation-2">
      <Link href={href} className="absolute inset-0 z-0" aria-label={`Open ${trip.name}`} />
      <CardContent className="pointer-events-none relative flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <StatusChip status={status.status}>{status.label}</StatusChip>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {formatDates(trip)}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <Link
              href={href}
              className="pointer-events-auto relative z-10 block truncate font-heading text-base font-semibold text-foreground hover:text-primary"
            >
              {trip.name}
            </Link>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <CountryFlag code={trip.country_code} />
              {destination ?? "No destination"}
            </p>
          </div>
        </div>

        <div className="pointer-events-auto relative z-10 flex items-center justify-between gap-2 border-t border-border pt-3">
          <Button asChild variant="outline" size="sm">
            <Link href={href}>{past ? "Open list" : "Open packing list"}</Link>
          </Button>
          <div className="flex items-center gap-1">
            <RecordAction icon={Copy} label="Duplicate" onClick={() => onDuplicate(trip)} />
            <RecordAction icon={Pencil} label="Edit" onClick={() => onEdit(trip)} />
            <RecordAction icon={Trash2} label="Delete" onClick={() => onDelete(trip)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Plane;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <span className={cn("flex size-10 items-center justify-center rounded-md", tone)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function TripsView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextBags, setNextBags] = useState<TripBag[]>([]);
  const [nextEntries, setNextEntries] = useState<TripEntry[]>([]);
  const [unit, setUnit] = useState<DisplayWeightUnit>("kg");
  const [view, setView] = useState<TripView>("all");
  const [sort, setSort] = useState<TripSort>("departure");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [duplicating, setDuplicating] = useState<Trip | null>(null);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);
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
    getProfile()
      .then((profile) => {
        if (profile?.weight_unit) setUnit(profile.weight_unit);
      })
      .catch(() => {});
  }, []);

  function openCreate() {
    setEditing(null);
    setDuplicating(null);
    setName("");
    setDestination("");
    setCountryCode("");
    setStartDate("");
    setEndDate("");
    setEditorOpen(true);
  }

  // The shell's "New trip" action links here with ?new=1 so one click opens the
  // create dialog instead of landing on the list and asking for a second click.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      // Opening the dialog on mount is the intended result of the shell linking
      // here with ?new=1; the synchronous state update is deliberate.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = useCallback((trip: Trip) => {
    setEditing(trip);
    setDuplicating(null);
    setName(trip.name);
    setDestination(trip.destination ?? "");
    setCountryCode(trip.country_code);
    setStartDate(trip.start_date ?? "");
    setEndDate(trip.end_date ?? "");
    setEditorOpen(true);
  }, []);

  const openDuplicate = useCallback((trip: Trip) => {
    const defaults = duplicateTripDefaults(trip);
    setEditing(null);
    setDuplicating(trip);
    setName(defaults.name);
    setDestination(defaults.destination ?? "");
    setCountryCode(defaults.countryCode);
    setStartDate(defaults.startDate ?? "");
    setEndDate(defaults.endDate ?? "");
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
      } else if (duplicating) {
        await duplicateTrip(duplicating.id, payload);
        toast.success("Trip duplicated");
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

  const allUpcoming = useMemo(() => trips.filter((trip) => !isPast(trip)), [trips]);
  const allPast = useMemo(() => trips.filter(isPast), [trips]);

  const sorted = useMemo(() => {
    const list = filterByName(trips, query);
    return [...list].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : startValue(a).localeCompare(startValue(b)),
    );
  }, [trips, query, sort]);

  const upcomingTrips = useMemo(
    () => (view === "past" ? [] : sorted.filter((trip) => !isPast(trip))),
    [sorted, view],
  );
  const pastTrips = useMemo(
    () => (view === "upcoming" ? [] : sorted.filter(isPast)),
    [sorted, view],
  );

  const featured = view === "past" ? null : (upcomingTrips[0] ?? null);

  useEffect(() => {
    if (!featured) return;
    let active = true;
    Promise.all([listTripBags(featured.id), listTripEntries(featured.id)])
      .then(([bags, entries]) => {
        if (!active) return;
        setNextBags(bags);
        setNextEntries(entries);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [featured]);

  const progress = useMemo(() => packingProgress(nextEntries), [nextEntries]);
  const baggage = useMemo(() => tripBaggageTotal(nextBags, nextEntries), [nextBags, nextEntries]);
  const progressPct = progress.total === 0 ? 0 : (progress.packed / progress.total) * 100;

  const matchingCount = upcomingTrips.length + pastTrips.length;
  const featuredCountdown = featured
    ? countdownLabel(departureCountdown(featured.start_date, featured.end_date))
    : null;
  const gridUpcoming = featured ? upcomingTrips.slice(1) : upcomingTrips;

  const views: { value: TripView; label: string; count: number }[] = [
    { value: "all", label: "All trips", count: trips.length },
    { value: "upcoming", label: "Active & upcoming", count: allUpcoming.length },
    { value: "past", label: "Past trips", count: allPast.length },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="My Trips"
        description="Manage upcoming departures, active gear checklists, and past trips."
        breadcrumb={[{ label: "Trips" }, { label: "All trips" }]}
      >
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" />
          New trip
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex flex-col gap-7">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-52 w-full rounded-xl" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        </div>
      ) : trips.length === 0 ? (
        <Card>
          <EmptyState
            icon={Plane}
            title="No trips yet"
            description="Create a trip to start building its packing list."
            action={
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" />
                Create your first trip
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div role="group" aria-label="Filter trips" className="flex flex-wrap gap-1.5">
              {views.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  size="sm"
                  variant={view === item.value ? "primary" : "outline"}
                  aria-pressed={view === item.value}
                  onClick={() => setView(item.value)}
                  className="rounded-full"
                >
                  {item.label} ({item.count})
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ListSearchToolbar
                id="trip-search"
                label="Search trips"
                value={query}
                onChange={setQuery}
                placeholder="Search trips"
              />
              <select
                aria-label="Sort trips"
                className={cn(inputVariants({ variant: "md" }), "w-auto pr-8")}
                value={sort}
                onChange={(event) => setSort(event.target.value as TripSort)}
              >
                <option value="departure">Sort: Departure date</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
          </div>

          {matchingCount === 0 ? (
            <Card>
              <EmptyState
                icon={SearchX}
                title={query ? `No trips match “${query}”.` : "Nothing here yet."}
                description={
                  query ? "Try a different search term." : "There are no trips in this view."
                }
              />
            </Card>
          ) : (
            <div className="flex flex-col gap-8">
              {upcomingTrips.length > 0 ? (
                <section className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-heading text-lg font-semibold tracking-tight">
                      Current &amp; upcoming trips
                    </h2>
                    <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                      {upcomingTrips.length} {upcomingTrips.length === 1 ? "trip" : "trips"}
                    </span>
                  </div>

                  {featured ? (
                    <Card className="relative overflow-hidden transition-shadow hover:shadow-elevation-2">
                      <Link
                        href={`/trip?id=${featured.id}`}
                        className="absolute inset-0 z-0"
                        aria-label={`Open ${featured.name}`}
                      />
                      <CardContent className="pointer-events-none relative flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusChip status="withMe">Next departure</StatusChip>
                            {featuredCountdown ? (
                              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                {featuredCountdown}
                              </span>
                            ) : null}
                          </div>
                          <Link
                            href={`/trip?id=${featured.id}`}
                            className="pointer-events-auto relative z-10 font-heading text-xl font-semibold tracking-tight hover:text-primary"
                          >
                            {featured.name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            {formatDestination(featured.destination, featured.country_code) ? (
                              <span className="flex items-center gap-1.5">
                                <CountryFlag code={featured.country_code} />
                                {formatDestination(featured.destination, featured.country_code)}
                              </span>
                            ) : null}
                            <span className="flex items-center gap-1">
                              <CalendarDays className="size-3.5" aria-hidden="true" />
                              {formatDates(featured)}
                            </span>
                          </div>
                          <div className="pointer-events-auto relative z-10 flex items-center gap-1 pt-1">
                            <RecordAction
                              icon={Copy}
                              label="Duplicate"
                              onClick={() => openDuplicate(featured)}
                            />
                            <RecordAction
                              icon={Pencil}
                              label="Edit"
                              onClick={() => openEdit(featured)}
                            />
                            <RecordAction
                              icon={Trash2}
                              label="Delete"
                              onClick={() => setPendingDelete(featured)}
                            />
                          </div>
                        </div>

                        <div className="pointer-events-auto relative z-10 flex w-full max-w-sm flex-col gap-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-mono font-medium tabular-nums">
                              {progress.packed}/{progress.total} packed
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Weight className="size-3.5" aria-hidden="true" />
                              <span className="font-mono tabular-nums">
                                {formatWeight(baggage.grams, unit)}
                              </span>
                            </span>
                          </div>
                          <Progress value={progressPct} />
                          <Button asChild className="w-full sm:w-auto">
                            <Link href={`/trip?id=${featured.id}`}>
                              Continue packing
                              <ArrowRight aria-hidden="true" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                  {gridUpcoming.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2">
                      {gridUpcoming.map((trip) => (
                        <TripCard
                          key={trip.id}
                          trip={trip}
                          onEdit={openEdit}
                          onDuplicate={openDuplicate}
                          onDelete={setPendingDelete}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {pastTrips.length > 0 ? (
                <section className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-heading text-lg font-semibold tracking-tight">
                      Past trips
                    </h2>
                    <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                      {pastTrips.length} {pastTrips.length === 1 ? "trip" : "trips"}
                    </span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {pastTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onEdit={openEdit}
                        onDuplicate={openDuplicate}
                        onDelete={setPendingDelete}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              icon={ListChecks}
              value={String(trips.length)}
              label="total trips logged"
              tone="bg-primary/10 text-primary"
            />
            <StatTile
              icon={Sparkles}
              value={String(allUpcoming.length)}
              label="active & upcoming"
              tone="bg-packed-soft text-packed-soft-foreground"
            />
            <StatTile
              icon={History}
              value={String(allPast.length)}
              label="past trips"
              tone="bg-with-me-soft text-with-me-soft-foreground"
            />
          </div>
        </>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit trip" : duplicating ? "Duplicate trip" : "New trip"}
              </DialogTitle>
              <DialogDescription>
                {duplicating
                  ? "Give the copy a name, a country and dates. It starts with the same packing list, unpacked."
                  : "Give your trip a name, a country and optional dates."}
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
                {saving ? "Saving..." : duplicating ? "Create copy" : "Save"}
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
