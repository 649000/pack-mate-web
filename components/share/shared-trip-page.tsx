"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Backpack, Link2Off, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
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
        <div className="flex flex-col gap-0.5">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
          >
            <Backpack className="size-4" aria-hidden="true" />
            Pack Mate
          </Link>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shared packing list
          </span>
        </div>
        {state.status === "ready" ? (
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}>
            <RefreshCw className="size-4" aria-hidden="true" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        ) : null}
      </div>

      {state.status === "loading" ? <Skeleton className="h-64 w-full rounded-lg" /> : null}

      {state.status === "unavailable" ? (
        <Card>
          <EmptyState
            icon={Link2Off}
            title="This shared list is not available."
            description="The link may have been revoked or expired."
            action={
              <Button asChild>
                <Link href="/">Go to Pack Mate</Link>
              </Button>
            }
          />
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
