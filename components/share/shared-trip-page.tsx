"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTable } from "@/components/ui/card";
import { SharedTripView } from "@/components/share/shared-trip-view";
import { getSharedTrip } from "@/lib/data";
import { isShareToken, shareTokenFromSearch } from "@/lib/share";
import type { SharedTrip } from "@/lib/types";

type State =
  | { status: "loading"; data: null }
  | { status: "ready"; data: SharedTrip }
  | { status: "unavailable"; data: null };

export function SharedTripPage() {
  const searchParams = useSearchParams();
  const token = shareTokenFromSearch(searchParams.toString());
  const validToken = isShareToken(token);

  const [state, setState] = useState<State>(() =>
    validToken ? { status: "loading", data: null } : { status: "unavailable", data: null },
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!validToken) return;
    let cancelled = false;
    getSharedTrip(token)
      .then((next) => {
        if (cancelled) return;
        setState(next ? { status: "ready", data: next } : { status: "unavailable", data: null });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unavailable", data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [token, validToken]);

  const refresh = useCallback(async () => {
    if (!validToken) return;
    setRefreshing(true);
    try {
      const next = await getSharedTrip(token);
      setState(next ? { status: "ready", data: next } : { status: "unavailable", data: null });
    } catch {
      setState({ status: "unavailable", data: null });
    } finally {
      setRefreshing(false);
    }
  }, [token, validToken]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Shared packing list
        </span>
        {state.status === "ready" ? (
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}>
            <RefreshCw className="size-4" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        ) : null}
      </div>

      {state.status === "loading" ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading shared list...</p>
      ) : null}

      {state.status === "unavailable" ? (
        <Card>
          <CardTable className="p-10 text-center text-sm text-muted-foreground">
            This shared list is not available.
          </CardTable>
        </Card>
      ) : null}

      {state.status === "ready" ? (
        <SharedTripView
          trip={state.data.trip}
          bags={state.data.bags}
          entries={state.data.entries}
        />
      ) : null}
    </main>
  );
}
