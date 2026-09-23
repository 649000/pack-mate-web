"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  Luggage,
  MapPin,
  PackageCheck,
  Plane,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layouts/page-header";
import { EmptyState } from "@/components/empty-state";
import { SuggestedItems } from "@/components/packing/suggested-items";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CountryFlag } from "@/components/ui/country-flag";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { formatDestination } from "@/lib/countries";
import { getProfile, listTripBags, listTripEntries, listTrips } from "@/lib/data";
import { packingProgress } from "@/lib/packing";
import { departureCountdown } from "@/lib/trip-status";
import { formatWeight, tripBaggageTotal } from "@/lib/weight";
import type { DisplayWeightUnit, ReusableItem, Trip, TripBag, TripEntry } from "@/lib/types";

// The dashboard suggests from rules only, so it has no library items to offer.
const NO_LIBRARY_ITEMS: ReusableItem[] = [];

function startValue(trip: Trip): string {
  return trip.start_date ?? "9999-12-31";
}

function isUpcoming(trip: Trip): boolean {
  const kind = departureCountdown(trip.start_date, trip.end_date).kind;
  return kind === "before" || kind === "today" || kind === "inProgress";
}

function formatDates(trip: Trip): string {
  if (!trip.start_date && !trip.end_date) return "No dates yet";
  if (trip.start_date && trip.end_date) return `${trip.start_date} → ${trip.end_date}`;
  return trip.start_date ?? trip.end_date ?? "No dates yet";
}

export function DashboardView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextBags, setNextBags] = useState<TripBag[]>([]);
  const [nextEntries, setNextEntries] = useState<TripEntry[]>([]);
  const [unit, setUnit] = useState<DisplayWeightUnit>("kg");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    listTrips()
      .then(setTrips)
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load trips");
      })
      .finally(() => {
        setLoading(false);
      });
    getProfile()
      .then((profile) => {
        if (profile?.weight_unit) setUnit(profile.weight_unit);
      })
      .catch(() => {});
  }, [reloadToken]);

  const upcoming = useMemo(
    () => trips.filter(isUpcoming).sort((a, b) => startValue(a).localeCompare(startValue(b))),
    [trips],
  );
  const nextTrip = upcoming[0] ?? null;

  useEffect(() => {
    if (!nextTrip) return;
    Promise.all([listTripBags(nextTrip.id), listTripEntries(nextTrip.id)])
      .then(([bags, entries]) => {
        setNextBags(bags);
        setNextEntries(entries);
      })
      .catch(() => {});
  }, [nextTrip]);

  const progress = useMemo(() => packingProgress(nextEntries), [nextEntries]);
  const baggage = useMemo(() => tripBaggageTotal(nextBags, nextEntries), [nextBags, nextEntries]);
  const progressPct = progress.total === 0 ? 0 : (progress.packed / progress.total) * 100;

  if (loading) {
    return (
      <div className="flex flex-col gap-7">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Welcome Back"
        description="Everything you are preparing for, in one place."
        breadcrumb={[{ label: "Pack Mate" }, { label: "Dashboard" }]}
      >
        <Button asChild>
          <Link href="/trips?new=1">
            <Plane aria-hidden="true" />
            Plan a trip
          </Link>
        </Button>
      </PageHeader>

      {trips.length === 0 ? (
        <Card>
          <EmptyState
            icon={Plane}
            title="No trips yet"
            description="Create a trip to start building its packing list."
            action={
              <Button asChild>
                <Link href="/trips?new=1">Create your first trip</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Plane className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-2xl font-semibold tabular-nums">{trips.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {trips.length === 1 ? "trip" : "trips"} planned
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex size-10 items-center justify-center rounded-md bg-packed-soft text-packed-soft-foreground">
                  <CalendarDays className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-2xl font-semibold tabular-nums">{upcoming.length}</p>
                  <p className="text-xs text-muted-foreground">active &amp; upcoming</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex size-10 items-center justify-center rounded-md bg-with-me-soft text-with-me-soft-foreground">
                  <PackageCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-2xl font-semibold tabular-nums">
                    {nextTrip && progress.total > 0 ? `${progress.packed}/${progress.total}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {!nextTrip
                      ? "no upcoming trip"
                      : progress.total === 0
                        ? "next trip has no items yet"
                        : "packed for your next trip"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {nextTrip ? (
            <Card className="relative transition-shadow hover:shadow-elevation-2">
              <Link
                href={`/trip?id=${nextTrip.id}`}
                className="absolute inset-0 z-0"
                aria-label={`Open ${nextTrip.name}`}
              />
              <CardContent className="pointer-events-none relative flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      Next journey
                    </span>
                    <Link
                      href={`/trip?id=${nextTrip.id}`}
                      className="pointer-events-auto relative z-10 font-heading text-xl font-semibold tracking-tight hover:text-primary"
                    >
                      {nextTrip.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {formatDestination(nextTrip.destination, nextTrip.country_code) ? (
                        <span className="flex items-center gap-1.5">
                          <CountryFlag code={nextTrip.country_code} />
                          {formatDestination(nextTrip.destination, nextTrip.country_code)}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        {formatDates(nextTrip)}
                      </span>
                    </div>
                  </div>
                  <StatusChip status="withMe">
                    {departureCountdown(nextTrip.start_date, nextTrip.end_date).kind ===
                    "inProgress"
                      ? "In progress"
                      : "Upcoming"}
                  </StatusChip>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-medium tabular-nums">
                      {progress.packed}/{progress.total} packed
                    </span>
                    <span className="font-mono text-muted-foreground tabular-nums">
                      {Math.round(progressPct)}%
                    </span>
                  </div>
                  <Progress value={progressPct} />
                </div>

                <div className="pointer-events-auto relative z-10 flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Luggage className="size-4" aria-hidden="true" />
                    <span className="font-mono tabular-nums">
                      {formatWeight(baggage.grams, unit)}
                    </span>
                    baggage total
                  </span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/trip?id=${nextTrip.id}`}>
                      Continue packing
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {nextTrip ? (
            <SuggestedItems
              trip={nextTrip}
              entries={nextEntries}
              libraryItems={NO_LIBRARY_ITEMS}
              onChanged={() => setReloadToken((token) => token + 1)}
              limit={1}
            />
          ) : null}

          <Card>
            <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  Upcoming &amp; recent trips
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/trips">
                    View all
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {[...trips]
                  .sort((a, b) => startValue(b).localeCompare(startValue(a)))
                  .slice(0, 5)
                  .map((trip) => (
                    <li key={trip.id}>
                      <Link
                        href={`/trip?id=${trip.id}`}
                        className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <MapPin className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {trip.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {formatDestination(trip.destination, trip.country_code) ??
                              "No destination"}
                            {" · "}
                            {formatDates(trip)}
                          </span>
                        </span>
                        {isUpcoming(trip) ? (
                          <StatusChip status="packed">Active</StatusChip>
                        ) : (
                          <StatusChip status="pending">Past</StatusChip>
                        )}
                      </Link>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardView />;
}
