"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Backpack, ListChecks, Luggage, Search, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Destination {
  title: string;
  path: string;
  icon: LucideIcon;
  keywords: string;
}

const destinations: Destination[] = [
  { title: "Trips", path: "/trips", icon: ListChecks, keywords: "trip travel packing list" },
  { title: "Bags", path: "/bags", icon: Luggage, keywords: "bag backpack suitcase container" },
  { title: "Items", path: "/items", icon: Backpack, keywords: "item library gear thing" },
];

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const results = destinations.filter((destination) =>
    `${destination.title} ${destination.keywords}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <Button
        variant="ghost"
        mode="icon"
        shape="circle"
        className="size-9"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4.5!" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="p-2">
            {results.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No results.</p>
            ) : (
              results.map((result) => (
                <button
                  key={result.path}
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(result.path);
                  }}
                >
                  <result.icon className="size-4 opacity-60" />
                  {result.title}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
