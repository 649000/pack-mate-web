"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Shared links"
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
        <CardTable>
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : links.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No shared links yet. Share a trip to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead className="hidden sm:table-cell">Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => {
                  const status = shareLinkStatus(link);
                  const active = status === "active";
                  return (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{tripName(link.trip_id)}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {formatDate(link.created_at)}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {formatDate(link.expires_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          size="sm"
                          variant={active ? "success" : "secondary"}
                          appearance="light"
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => void copy(link)}>
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!active || busyId === link.id}
                            onClick={() => void regenerate(link)}
                          >
                            Regenerate
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!active || busyId === link.id}
                            onClick={() => void revoke(link)}
                          >
                            Revoke
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardTable>
      </Card>
    </div>
  );
}

export default function SharesPage() {
  return <SharesView />;
}
