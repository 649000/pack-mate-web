"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  addAdHocEntry,
  addLibraryBagToTrip,
  addLibraryItemToTrip,
  deleteEntry,
  getTrip,
  listBags,
  listItems,
  listTripBags,
  listTripEntries,
  reorderEntries,
  setEntryLocation,
  updateEntry,
} from "@/lib/data";
import {
  destinationBagId,
  destinationToLocation,
  groupEntries,
  locationValue,
  packingProgress,
  type Destination,
} from "@/lib/packing";
import type { ReusableBag, ReusableItem, Trip, TripBag, TripEntry } from "@/lib/types";
import { parseQty, validateName } from "@/lib/validation";

function SortableEntry({
  entry,
  bags,
  onTogglePacked,
  onMove,
  onDelete,
}: {
  entry: TripEntry;
  bags: TripBag[];
  onTogglePacked: (entry: TripEntry) => void;
  onMove: (entry: TripEntry, destination: Destination) => void;
  onDelete: (entry: TripEntry) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-card px-2 py-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none px-1 text-muted-foreground"
        aria-label="Reorder"
        {...attributes}
        {...listeners}
      >
        ::
      </button>
      <Checkbox
        checked={entry.is_packed}
        onCheckedChange={() => onTogglePacked(entry)}
        aria-label={entry.is_packed ? "Mark unpacked" : "Mark packed"}
      />
      <span
        className={
          entry.is_packed ? "flex-1 text-sm line-through text-muted-foreground" : "flex-1 text-sm"
        }
      >
        {entry.name}
      </span>
      {entry.qty > 1 ? <Badge variant="secondary">x{entry.qty}</Badge> : null}
      <select
        className="h-7 rounded-md border border-input bg-background px-2 text-xs"
        value={locationValue(entry)}
        onChange={(event) => onMove(entry, event.target.value)}
        aria-label="Location"
      >
        <option value="loose">Loose</option>
        <option value="with_me">With Me</option>
        {bags.map((bag) => (
          <option key={bag.id} value={`bag:${bag.id}`}>
            {bag.name}
          </option>
        ))}
      </select>
      <Button variant="ghost" size="sm" onClick={() => onDelete(entry)}>
        Remove
      </Button>
    </div>
  );
}

function EntryGroup({
  title,
  entries,
  bags,
  onTogglePacked,
  onMove,
  onDelete,
  onReorder,
}: {
  title: string;
  entries: TripEntry[];
  bags: TripBag[];
  onTogglePacked: (entry: TripEntry) => void;
  onMove: (entry: TripEntry, destination: Destination) => void;
  onDelete: (entry: TripEntry) => void;
  onReorder: (ordered: TripEntry[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((entry) => entry.id === active.id);
    const newIndex = entries.findIndex((entry) => entry.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(entries, oldIndex, newIndex));
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {title}
          <span className="text-xs font-normal text-muted-foreground">
            {entries.filter((entry) => entry.is_packed).length}/{entries.length} packed
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing here yet.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={entries.map((entry) => entry.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <SortableEntry
                    key={entry.id}
                    entry={entry}
                    bags={bags}
                    onTogglePacked={onTogglePacked}
                    onMove={onMove}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}

function TripView() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get("id") ?? "";

  const [trip, setTrip] = useState<Trip | null>(null);
  const [bags, setBags] = useState<TripBag[]>([]);
  const [entries, setEntries] = useState<TripEntry[]>([]);
  const [libraryBags, setLibraryBags] = useState<ReusableBag[]>([]);
  const [libraryItems, setLibraryItems] = useState<ReusableItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [addBagId, setAddBagId] = useState("");
  const [addItemId, setAddItemId] = useState("");
  const [addItemDestination, setAddItemDestination] = useState<Destination>("loose");
  const [adhocName, setAdhocName] = useState("");
  const [adhocQty, setAdhocQty] = useState("1");
  const [adhocDestination, setAdhocDestination] = useState<Destination>("loose");

  function refresh() {
    if (!tripId) return Promise.resolve();
    return Promise.all([
      getTrip(tripId),
      listTripBags(tripId),
      listTripEntries(tripId),
      listBags(),
      listItems(),
    ])
      .then(([nextTrip, nextBags, nextEntries, nextLibraryBags, nextLibraryItems]) => {
        setTrip(nextTrip);
        setBags(nextBags);
        setEntries(nextEntries);
        setLibraryBags(nextLibraryBags);
        setLibraryItems(nextLibraryItems);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load trip");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const progress = useMemo(() => packingProgress(entries), [entries]);

  const {
    byBag: entriesByBag,
    withMe: withMeEntries,
    loose: looseEntries,
  } = useMemo(() => groupEntries(entries, bags), [entries, bags]);

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  function handleAddBag() {
    if (!addBagId) return;
    void run(async () => {
      await addLibraryBagToTrip(tripId, addBagId);
      setAddBagId("");
    }, "Bag added");
  }

  function handleAddLibraryItem() {
    if (!addItemId) return;
    const destination = addItemDestination;
    void run(async () => {
      const bagId = destinationBagId(destination);
      const entryId = await addLibraryItemToTrip(tripId, addItemId, bagId);
      if (destination === "with_me") {
        await updateEntry(entryId, { trip_bag_id: null, is_with_me: true });
      }
      setAddItemId("");
    }, "Item added");
  }

  function handleAddAdHoc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const destination = adhocDestination;
    void run(async () => {
      const bagId = destinationBagId(destination);
      const entry = await addAdHocEntry({
        tripId,
        name: validateName(adhocName, "Item name"),
        qty: parseQty(adhocQty),
        tripBagId: bagId,
      });
      if (destination === "with_me") {
        await updateEntry(entry.id, { trip_bag_id: null, is_with_me: true });
      }
      setAdhocName("");
      setAdhocQty("1");
    }, "Item added");
  }

  function handleTogglePacked(entry: TripEntry) {
    void run(() => updateEntry(entry.id, { is_packed: !entry.is_packed }), "Updated");
  }

  function handleMove(entry: TripEntry, destination: Destination) {
    void run(() => setEntryLocation(entry, destinationToLocation(destination)), "Moved");
  }

  function handleDelete(entry: TripEntry) {
    void run(() => deleteEntry(entry.id), "Removed");
  }

  function handleReorder(ordered: TripEntry[]) {
    setEntries((current) =>
      current.map((entry) => {
        const index = ordered.findIndex((candidate) => candidate.id === entry.id);
        return index === -1 ? entry : { ...entry, position: index };
      }),
    );
    void run(() => reorderEntries(ordered), "Reordered");
  }

  if (!tripId) {
    return <p className="text-sm text-muted-foreground">No trip selected.</p>;
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!trip) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Trip not found.</p>
        <Link href="/trips" className="text-sm underline">
          Back to trips
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Link href="/trips" className="text-xs text-muted-foreground hover:text-foreground">
          Back to trips
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">{trip.name}</h1>
        <div className="flex items-center gap-3">
          <Progress
            value={progress.total === 0 ? 0 : (progress.packed / progress.total) * 100}
            className="h-2 flex-1"
          />
          <span className="text-xs text-muted-foreground">
            {progress.packed}/{progress.total} packed
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="add-bag">Add a bag from your library</Label>
              <select
                id="add-bag"
                className="h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem]"
                value={addBagId}
                onChange={(event) => setAddBagId(event.target.value)}
              >
                <option value="">Select a bag</option>
                {libraryBags.map((bag) => (
                  <option key={bag.id} value={bag.id}>
                    {bag.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" onClick={handleAddBag} disabled={!addBagId}>
              Add bag
            </Button>
          </div>

          <Separator />

          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="add-item">Add an item from your library</Label>
              <select
                id="add-item"
                className="h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem]"
                value={addItemId}
                onChange={(event) => setAddItemId(event.target.value)}
              >
                <option value="">Select an item</option>
                {libraryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              className="h-8.5 rounded-md border border-input bg-background px-3 text-[0.8125rem]"
              value={addItemDestination}
              onChange={(event) => setAddItemDestination(event.target.value)}
              aria-label="Destination"
            >
              <option value="loose">Loose</option>
              <option value="with_me">With Me</option>
              {bags.map((bag) => (
                <option key={bag.id} value={`bag:${bag.id}`}>
                  {bag.name}
                </option>
              ))}
            </select>
            <Button type="button" onClick={handleAddLibraryItem} disabled={!addItemId}>
              Add item
            </Button>
          </div>

          <Separator />

          <form className="flex items-end gap-2" onSubmit={handleAddAdHoc}>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="adhoc-name">Add a one-off item</Label>
              <Input
                id="adhoc-name"
                value={adhocName}
                onChange={(event) => setAdhocName(event.target.value)}
                placeholder="e.g. Travel adapter"
              />
            </div>
            <div className="w-20">
              <Label htmlFor="adhoc-qty">Qty</Label>
              <Input
                id="adhoc-qty"
                type="number"
                min={1}
                step={1}
                value={adhocQty}
                onChange={(event) => setAdhocQty(event.target.value)}
              />
            </div>
            <select
              className="h-8.5 rounded-md border border-input bg-background px-3 text-[0.8125rem]"
              value={adhocDestination}
              onChange={(event) => setAdhocDestination(event.target.value)}
              aria-label="Destination"
            >
              <option value="loose">Loose</option>
              <option value="with_me">With Me</option>
              {bags.map((bag) => (
                <option key={bag.id} value={`bag:${bag.id}`}>
                  {bag.name}
                </option>
              ))}
            </select>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      {progress.total === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nothing on this list yet. Add a bag or an item above.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {bags.map((bag) => (
            <EntryGroup
              key={bag.id}
              title={bag.name}
              entries={entriesByBag.get(bag.id) ?? []}
              bags={bags}
              onTogglePacked={handleTogglePacked}
              onMove={handleMove}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          ))}
          <EntryGroup
            title="With Me"
            entries={withMeEntries}
            bags={bags}
            onTogglePacked={handleTogglePacked}
            onMove={handleMove}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
          <EntryGroup
            title="Not assigned"
            entries={looseEntries}
            bags={bags}
            onTogglePacked={handleTogglePacked}
            onMove={handleMove}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        </div>
      )}
    </div>
  );
}

export default function TripPage() {
  return (
    <RequireAuth>
      <AppShell>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
          <TripView />
        </Suspense>
      </AppShell>
    </RequireAuth>
  );
}
