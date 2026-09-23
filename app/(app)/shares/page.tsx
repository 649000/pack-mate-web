"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, Copy, RefreshCw, Share2 } from "lucide-react";
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
import { PageHeader } from "@/components/layouts/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardHeading, CardTitle } from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { Skeleton } from "@/components/ui/skeleton";
import { listShareLinks, listTrips, regenerateShareLink, revokeShareLink } from "@/lib/data";
import { buildShareUrl, shareLinkStatus } from "@/lib/share";
import type { ShareLink, Trip } from "@/lib/types";

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return value.slice(0, 10);
}

export function SharesView() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  function refresh() {
    return Promise.all([listShareLinks(), listTrips()])
      .then(([nextLinks, nextTrips]) => {
        setLinks(nextLinks);
        setTrips(nextTrips);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load shared links");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    void refresh();
  }, []);

  function tripName(tripId: string): string {
    return trips.find((trip) => trip.id === tripId)?.name ?? "Trip";
  }

  async function copy(link: ShareLink) {
    try {
      await navigator.clipboard.writeText(buildShareUrl(link.token, window.location.origin));
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  }

  async function regenerate(link: ShareLink) {
    setBusyId(link.id);
    try {
      await regenerateShareLink(link.id);
      toast.success("New link created");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to regenerate link");
    } finally {
      setBusyId(null);
    }
  }

  async function revoke(link: ShareLink) {
    setBusyId(link.id);
    try {
      await revokeShareLink(link.id);
      toast.success("Link revoked");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke link");
    } finally {
      setBusyId(null);
    }
  }

  const copyLink = useCallback((link: ShareLink) => void copy(link), []);
  const regenerateLink = useCallback((link: ShareLink) => void regenerate(link), []);
  const revokeLink = useCallback((link: ShareLink) => void revoke(link), []);

  const columns = useMemo<ColumnDef<ShareLink>[]>(
    () => [
      {
        id: "trip",
        accessorFn: (link) => tripName(link.trip_id),
        meta: { headerTitle: "Trip" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Trip" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
              <Share2 className="size-4" aria-hidden="true" />
            </span>
            <Link
              href={`/trip?id=${row.original.trip_id}`}
              className="font-medium hover:text-primary"
            >
              {tripName(row.original.trip_id)}
            </Link>
          </div>
        ),
      },
      {
        id: "created",
        accessorFn: (link) => link.created_at,
        meta: {
          headerTitle: "Created",
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Created" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>
        ),
      },
      {
        id: "expires",
        accessorFn: (link) => link.expires_at,
        meta: {
          headerTitle: "Expires",
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Expires" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.expires_at)}</span>
        ),
      },
      {
        id: "status",
        accessorFn: (link) => shareLinkStatus(link),
        meta: { headerTitle: "Status" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const status = shareLinkStatus(row.original);
          return (
            <Badge
              size="sm"
              variant={status === "active" ? "success" : "secondary"}
              appearance="light"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const active = shareLinkStatus(row.original) === "active";
          const busy = busyId === row.original.id;
          return (
            <div className="flex justify-end gap-1">
              <RecordAction
                icon={Copy}
                label="Copy"
                disabled={busy}
                onClick={() => copyLink(row.original)}
              />
              <RecordAction
                icon={RefreshCw}
                label="Regenerate"
                disabled={!active || busy}
                onClick={() => regenerateLink(row.original)}
              />
              <RecordAction
                icon={Ban}
                label="Revoke"
                disabled={!active || busy}
                onClick={() => revokeLink(row.original)}
              />
            </div>
          );
        },
      },
    ],
    [busyId, copyLink, regenerateLink, revokeLink, trips],
  );

  const table = useReactTable({
    data: links,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Shared Links"
        description="Public, read-only links to your packing lists."
        breadcrumb={[{ label: "Packing" }, { label: "Shared links" }]}
      />

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Your links</CardTitle>
            <CardDescription>
              {links.length} {links.length === 1 ? "link" : "links"}
            </CardDescription>
          </CardHeading>
        </CardHeader>
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <EmptyState
            icon={Share2}
            title="No shared links yet"
            description="Share a trip to create a read-only link you can send to anyone."
            action={
              <Button asChild>
                <Link href="/trips">Go to trips</Link>
              </Button>
            }
          />
        ) : (
          <DataGrid table={table} recordCount={links.length} tableLayout={{ width: "auto" }}>
            <div className="overflow-x-auto">
              <DataGridTable />
            </div>
          </DataGrid>
        )}
      </Card>
    </div>
  );
}

export default function SharesPage() {
  return <SharesView />;
}
