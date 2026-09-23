"use client";

import { useCallback, useEffect, useState } from "react";
import { Lightbulb, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addAdHocEntry,
  addLibraryItemToTrip,
  dismissSuggestion,
  getDestinationFacts,
  listSuggestionDismissals,
} from "@/lib/data";
import { getTripSuggestions, type Suggestion, type SuggestionContext } from "@/lib/suggestions";
import type { ReusableItem, Trip, TripEntry } from "@/lib/types";

// Proposes items the trip may be missing, derived from data the app already
// holds. Adding uses the library when a match exists, otherwise creates a new
// item; either way the suggestion disappears because the item now exists.
export function SuggestedItems({
  trip,
  entries,
  libraryItems,
  onChanged,
  limit,
}: {
  trip: Trip;
  entries: TripEntry[];
  libraryItems: ReusableItem[];
  onChanged: () => void | Promise<void>;
  limit?: number;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getDestinationFacts(trip.country_code), listSuggestionDismissals(trip.id)])
      .then(async ([facts, dismissed]) => {
        const context: SuggestionContext = {
          trip: {
            id: trip.id,
            destination: trip.destination,
            countryCode: trip.country_code,
            startDate: trip.start_date,
            endDate: trip.end_date,
          },
          facts,
          entries: entries.map((entry) => ({
            name: entry.name,
            category: entry.category,
            isWithMe: entry.is_with_me,
          })),
          libraryItems: libraryItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
          })),
        };
        const next = await getTripSuggestions(context);
        if (!active) return;
        const dismissedSet = new Set(dismissed);
        setSuggestions(next.filter((suggestion) => !dismissedSet.has(suggestion.key)));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    trip.id,
    trip.destination,
    trip.country_code,
    trip.start_date,
    trip.end_date,
    entries,
    libraryItems,
  ]);

  const add = useCallback(
    async (suggestion: Suggestion) => {
      setBusyKey(suggestion.key);
      try {
        if (suggestion.action.kind === "library-item") {
          await addLibraryItemToTrip(trip.id, suggestion.action.itemId, null);
        } else {
          await addAdHocEntry({
            tripId: trip.id,
            name: suggestion.action.name,
            qty: 1,
            tripBagId: null,
          });
        }
        setSuggestions((current) => current.filter((item) => item.key !== suggestion.key));
        await onChanged();
        toast.success("Added to your trip");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not add the item");
      } finally {
        setBusyKey(null);
      }
    },
    [onChanged, trip.id],
  );

  const dismiss = useCallback(
    async (suggestion: Suggestion) => {
      setBusyKey(suggestion.key);
      try {
        await dismissSuggestion({
          tripId: trip.id,
          key: suggestion.key,
          source: suggestion.source,
        });
        setSuggestions((current) => current.filter((item) => item.key !== suggestion.key));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not dismiss the suggestion");
      } finally {
        setBusyKey(null);
      }
    },
    [trip.id],
  );

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  const visible = typeof limit === "number" ? suggestions.slice(0, limit) : suggestions;
  if (visible.length === 0) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lightbulb className="size-4 text-muted-foreground" aria-hidden="true" />
          Suggested for this trip
        </h3>
        <ul className="flex flex-col divide-y divide-border">
          {visible.map((suggestion) => (
            <li key={suggestion.key} className="flex flex-wrap items-center gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{suggestion.name}</p>
                <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyKey !== null}
                aria-label={`Add ${suggestion.name} to trip`}
                onClick={() => void add(suggestion)}
              >
                <Plus aria-hidden="true" />
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                mode="icon"
                disabled={busyKey !== null}
                aria-label={`Dismiss ${suggestion.name}`}
                onClick={() => void dismiss(suggestion)}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
