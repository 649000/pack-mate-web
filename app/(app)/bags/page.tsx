"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Copy, Luggage, PackageOpen, Pencil, Plane, Plus, Trash2 } from "lucide-react";
import { AddToTripDialog } from "@/components/add-to-trip-dialog";
import { EmptyState } from "@/components/empty-state";
import { RecordAction } from "@/components/record-action";
import { ListSearchToolbar } from "@/components/list-search";
import { BagIcon } from "@/components/packing/bag-icon";
import { LibraryPicker, type LibraryPickerOption } from "@/components/library-picker";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  addBagItem,
  addLibraryBagToTrip,
  createBag,
  deleteBag,
  duplicateBag,
  getProfile,
  listAllBagItems,
  listBagContents,
  listBags,
  listItems,
  listTrips,
  removeBagItem,
  updateBag,
} from "@/lib/data";
import type {
  DisplayWeightUnit,
  ReusableBag,
  ReusableBagItem,
  ReusableItem,
  Trip,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  BAG_ICONS,
  BAG_ICON_KEYS,
  BAG_ICON_LABELS,
  type BagIcon as BagIconKey,
} from "@/lib/bag-icons";
import { filterByName } from "@/lib/packing";
import { parseQty, validateName, ITEM_CATEGORY_LABELS } from "@/lib/validation";
import { formatWeight, fromGrams, toGrams } from "@/lib/weight";

export function BagsView() {
  const [bags, setBags] = useState<ReusableBag[]>([]);
  const [items, setItems] = useState<ReusableItem[]>([]);
  const [allBagItems, setAllBagItems] = useState<ReusableBagItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [addTarget, setAddTarget] = useState<ReusableBag | null>(null);
  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReusableBag | null>(null);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [icon, setIcon] = useState<BagIconKey | "">("");
  const [weightUnit, setWeightUnit] = useState<DisplayWeightUnit>("kg");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ReusableBag | null>(null);

  const [contentsBag, setContentsBag] = useState<ReusableBag | null>(null);
  const [contents, setContents] = useState<ReusableBagItem[]>([]);
  const [addItemId, setAddItemId] = useState("");
  const [addQty, setAddQty] = useState("1");
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  function refresh() {
    return Promise.all([listBags(), listItems(), listAllBagItems(), getProfile(), listTrips()])
      .then(([nextBags, nextItems, nextBagItems, profile, nextTrips]) => {
        setBags(nextBags);
        setItems(nextItems);
        setAllBagItems(nextBagItems);
        setTrips(nextTrips);
        setWeightUnit(profile?.weight_unit ?? "kg");
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load bags");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    void refresh();
  }, []);

  function itemName(id: string) {
    return items.find((item) => item.id === id)?.name ?? "Unknown item";
  }

  function itemCategory(id: string) {
    return items.find((item) => item.id === id)?.category ?? null;
  }

  function openCreate() {
    setEditing(null);
    setName("");
    setLimit("");
    setIcon("");
    setEditorOpen(true);
  }

  const openEdit = useCallback(
    (bag: ReusableBag) => {
      setEditing(bag);
      setName(bag.name);
      setIcon(bag.icon ?? "");
      setLimit(
        bag.weight_limit_grams === null
          ? ""
          : String(Number(fromGrams(bag.weight_limit_grams, weightUnit).toFixed(2))),
      );
      setEditorOpen(true);
    },
    [weightUnit],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: validateName(name, "Bag name"),
        icon: icon === "" ? null : icon,
        weightLimitGrams:
          limit.trim() === "" ? null : Math.round(toGrams(Number(limit), weightUnit)),
      };
      if (editing) {
        await updateBag(editing.id, payload);
        toast.success("Bag updated");
      } else {
        await createBag(payload);
        toast.success("Bag created");
      }
      setEditorOpen(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save bag");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteBag(pendingDelete.id);
      toast.success("Bag deleted");
      setPendingDelete(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete bag");
    }
  }

  async function handleDuplicate(bag: ReusableBag) {
    try {
      await duplicateBag(bag.id);
      toast.success("Bag duplicated");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate bag");
    }
  }

  const openContents = useCallback(async (bag: ReusableBag) => {
    setContentsBag(bag);
    setAddItemId("");
    setAddQty("1");
    try {
      setContents(await listBagContents(bag.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load contents");
    }
  }, []);

  async function handleAddContent() {
    if (!contentsBag || !addItemId) return;
    try {
      await addBagItem(contentsBag.id, addItemId, parseQty(addQty));
      setContents(await listBagContents(contentsBag.id));
      setAllBagItems(await listAllBagItems());
      setAddItemId("");
      setAddQty("1");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add item");
    }
  }

  async function handleRemoveContent(id: string) {
    if (!contentsBag) return;
    try {
      await removeBagItem(id);
      setContents(await listBagContents(contentsBag.id));
      setAllBagItems(await listAllBagItems());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove item");
    }
  }

  const visibleBags = filterByName(bags, query);
  const contentsByBag = useMemo(() => {
    const map = new Map<string, ReusableBagItem[]>();
    for (const row of allBagItems) {
      const list = map.get(row.bag_id) ?? [];
      list.push(row);
      map.set(row.bag_id, list);
    }
    return map;
  }, [allBagItems]);

  const itemOptions = useMemo<LibraryPickerOption[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        detail: item.category ? ITEM_CATEGORY_LABELS[item.category] : undefined,
        category: item.category,
      })),
    [items],
  );

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Bag Library"
        description="Reusable containers and their usual contents."
        breadcrumb={[{ label: "Library" }, { label: "Bags" }]}
      >
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" />
          Add bag
        </Button>
      </PageHeader>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : bags.length === 0 ? (
        <Card>
          <EmptyState
            icon={Luggage}
            title="No bags yet"
            description="Add your first one to reuse it across trips."
            action={
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" />
                Add your first bag
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ListSearchToolbar
              id="bag-search"
              label="Search bags"
              value={query}
              onChange={setQuery}
              placeholder="Search bags"
            />
            <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
              {bags.length} {bags.length === 1 ? "bag" : "bags"}
            </span>
          </div>

          {visibleBags.length === 0 ? (
            <Card>
              <EmptyState
                icon={PackageOpen}
                title={`No bags match “${query}”.`}
                description="Try a different search term."
              />
            </Card>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {visibleBags.map((bag) => {
                const bagContents = contentsByBag.get(bag.id) ?? [];
                return (
                  <Card key={bag.id}>
                    <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <BagIcon
                              icon={bag.icon}
                              categories={bagContents.map((row) => itemCategory(row.item_id))}
                              className="size-5"
                            />
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate font-heading text-base font-semibold text-foreground">
                              {bag.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {bagContents.length}{" "}
                              {bagContents.length === 1 ? "default item" : "default items"}
                            </p>
                          </div>
                        </div>
                        <StatusChip status="neutral">
                          {bag.weight_limit_grams === null
                            ? "No limit"
                            : `Limit ${formatWeight(bag.weight_limit_grams, weightUnit)}`}
                        </StatusChip>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
                          Default items ({bagContents.length})
                        </p>
                        {bagContents.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No default items yet.</p>
                        ) : (
                          <ul className="flex flex-col gap-1.5">
                            {bagContents.map((row) => (
                              <li
                                key={row.id}
                                className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-1.5 text-sm"
                              >
                                <span className="min-w-0 truncate text-foreground">
                                  {itemName(row.item_id)}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                  x{row.qty}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1 border-t border-border pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void openContents(bag)}
                          aria-label="Contents"
                        >
                          Manage contents
                        </Button>
                        <RecordAction
                          icon={Plane}
                          label="Add to trip"
                          onClick={() => setAddTarget(bag)}
                        />
                        <RecordAction
                          icon={Copy}
                          label="Duplicate"
                          onClick={() => void handleDuplicate(bag)}
                        />
                        <RecordAction icon={Pencil} label="Edit" onClick={() => openEdit(bag)} />
                        <RecordAction
                          icon={Trash2}
                          label="Delete"
                          onClick={() => setPendingDelete(bag)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit bag" : "New bag"}</DialogTitle>
              <DialogDescription>A bag is a container you reuse across trips.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bag-name">Name</Label>
                <Input
                  id="bag-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Icon</Label>
                <div role="group" aria-label="Bag icon" className="grid grid-cols-7 gap-1.5">
                  {BAG_ICON_KEYS.map((key) => {
                    const IconOption = BAG_ICONS[key];
                    const selected = icon === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setIcon(selected ? "" : key)}
                        aria-pressed={selected}
                        aria-label={BAG_ICON_LABELS[key]}
                        title={BAG_ICON_LABELS[key]}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-md border transition-colors",
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <IconOption className="size-4" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional. Defaults to an icon based on the bag&rsquo;s contents.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bag-limit">Weight limit ({weightUnit})</Label>
                <Input
                  id="bag-limit"
                  type="number"
                  min={0}
                  step="0.01"
                  value={limit}
                  onChange={(event) => setLimit(event.target.value)}
                  placeholder={weightUnit === "kg" ? "e.g. 23" : "e.g. 50"}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={contentsBag !== null} onOpenChange={(open) => !open && setContentsBag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{contentsBag?.name} contents</DialogTitle>
            <DialogDescription>
              These items are copied into a trip when you add this bag.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {contents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No default contents yet.</p>
            ) : (
              contents.map((row) => (
                <div key={row.id} className="flex items-center gap-3 text-sm">
                  <span className="flex-1">{itemName(row.item_id)}</span>
                  <span className="font-mono text-muted-foreground tabular-nums">x{row.qty}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleRemoveContent(row.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
            <Separator />
            <div className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="content-item">Item</Label>
                <LibraryPicker
                  id="content-item"
                  label="Item"
                  placeholder="Select an item"
                  value={addItemId}
                  onChange={setAddItemId}
                  options={itemOptions}
                  emptyMessage="No items in your library yet."
                />
              </div>
              <div className="w-20">
                <Label htmlFor="content-qty">Qty</Label>
                <Input
                  id="content-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={addQty}
                  onChange={(event) => setAddQty(event.target.value)}
                />
              </div>
              <Button type="button" onClick={() => void handleAddContent()} disabled={!addItemId}>
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddToTripDialog
        open={addTarget !== null}
        onOpenChange={(open) => !open && setAddTarget(null)}
        trips={trips}
        subject={addTarget?.name ?? ""}
        onAdd={async (tripId) => {
          if (!addTarget) return;
          try {
            await addLibraryBagToTrip(tripId, addTarget.id);
            toast.success("Added to trip");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add to trip");
          }
        }}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bag?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &ldquo;{pendingDelete?.name}&rdquo; from your library. Existing packing
              lists are not changed.
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

export default function BagsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
      <BagsView />
    </Suspense>
  );
}
