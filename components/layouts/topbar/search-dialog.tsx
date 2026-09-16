"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Backpack, ListChecks, Luggage, Search, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listBags, listItems, listTrips } from "@/lib/data";
import { filterByName } from "@/lib/packing";
import type { ReusableBag, ReusableItem, Trip } from "@/lib/types";

interface Destination {
  title: string;
  path: string;
  icon: LucideIcon;
}

const destinations: Destination[] = [
  { title: "Trips", path: "/trips", icon: ListChecks },
  { title: "Bags", path: "/bags", icon: Luggage },
  { title: "Items", path: "/items", icon: Backpack },
];

type SearchData = { trips: Trip[]; items: ReusableItem[]; bags: ReusableBag[] };

const emptyData: SearchData = { trips: [], items: [], bags: [] };

function ResultButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent"
      onClick={onClick}
    >
      <Icon className="size-4 shrink-0 opacity-60" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function ResultGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-2.5 py-1 text-xs font-medium text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  function loadLibrary() {
    setLoading(true);
    setError(false);
    Promise.all([listTrips(), listItems(), listBags()])
      .then(([trips, items, bags]) => setData({ trips, items, bags }))
      .catch(() => {
        setError(true);
        setData(emptyData);
      })
      .finally(() => setLoading(false));
  }

  function openDialog() {
    setQuery("");
    setOpen(true);
    loadLibrary();
  }

  const trimmed = query.trim();
  const matches = useMemo(
    () => ({
      trips: filterByName(data.trips, query),
      items: filterByName(data.items, query),
      bags: filterByName(data.bags, query),
    }),
    [data, query],
  );
  const totalMatches = matches.trips.length + matches.items.length + matches.bags.length;

  function openResult(path: string) {
    setOpen(false);
    setQuery("");
    router.push(`${path}?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <Button
        variant="ghost"
        mode="icon"
        shape="circle"
        className="size-9"
        aria-label="Search"
        onClick={openDialog}
      >
        <Search className="size-4.5!" />
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="border-b border-border p-3">
            <Input
              autoFocus
              placeholder="Search Pack Mate..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {trimmed.length === 0 ? (
              destinations.map((destination) => (
                <ResultButton
                  key={destination.path}
                  icon={destination.icon}
                  label={destination.title}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(destination.path);
                  }}
                />
              ))
            ) : loading ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Searching...</p>
            ) : error ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Could not load your library.
              </p>
            ) : totalMatches === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No results.</p>
            ) : (
              <>
                {matches.trips.length > 0 ? (
                  <ResultGroup title="Trips">
                    {matches.trips.map((trip) => (
                      <ResultButton
                        key={trip.id}
                        icon={ListChecks}
                        label={trip.name}
                        onClick={() => openResult("/trips")}
                      />
                    ))}
                  </ResultGroup>
                ) : null}
                {matches.items.length > 0 ? (
                  <ResultGroup title="Items">
                    {matches.items.map((item) => (
                      <ResultButton
                        key={item.id}
                        icon={Backpack}
                        label={item.name}
                        onClick={() => openResult("/items")}
                      />
                    ))}
                  </ResultGroup>
                ) : null}
                {matches.bags.length > 0 ? (
                  <ResultGroup title="Bags">
                    {matches.bags.map((bag) => (
                      <ResultButton
                        key={bag.id}
                        icon={Luggage}
                        label={bag.name}
                        onClick={() => openResult("/bags")}
                      />
                    ))}
                  </ResultGroup>
                ) : null}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
