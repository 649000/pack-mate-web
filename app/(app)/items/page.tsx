"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ListPlus,
  Package,
  Pencil,
  Plus,
  SearchX,
  Tags,
  Trash2,
  Weight,
} from "lucide-react";
import { AddToTripDialog } from "@/components/add-to-trip-dialog";
import { EmptyState } from "@/components/empty-state";
import { RecordAction } from "@/components/record-action";
import { ListSearchToolbar } from "@/components/list-search";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "@/components/packing/category-badge";
import { CategoryIcon } from "@/components/packing/category-icon";
import { CategoryFilterChips } from "@/components/packing/category-filter-chips";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, inputVariants } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import {
  addLibraryItemToTrip,
  createItem,
  deleteItem,
  getProfile,
  listItems,
  listTrips,
  updateItem,
} from "@/lib/data";
import { filterByName, filterEntriesByCategory, type CategoryFilter } from "@/lib/packing";
import type { DisplayWeightUnit, ItemCategory, ReusableItem, Trip } from "@/lib/types";
import {
  ITEM_CATEGORY_GROUPS,
  ITEM_CATEGORY_LABELS,
  parseQty,
  validateName,
} from "@/lib/validation";
import { formatWeight, fromGrams, toGrams } from "@/lib/weight";

type ItemSort = "name" | "weight-desc" | "weight-asc";

const PAGE_SIZE = 20;

function ItemThumbnail({ item }: { item: ReusableItem }) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt={item.name}
        className="size-10 shrink-0 rounded-md border border-border object-cover"
      />
    );
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
      <CategoryIcon category={item.category} className="size-5" />
    </span>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Package;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <span className={cn("flex size-10 items-center justify-center rounded-md", tone)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function HeadCell({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function ItemsView() {
  const [items, setItems] = useState<ReusableItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [addTarget, setAddTarget] = useState<ReusableItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReusableItem | null>(null);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<DisplayWeightUnit>("kg");
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<ItemSort>("name");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ReusableItem | null>(null);
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);

  function refresh() {
    return Promise.all([listItems(), getProfile(), listTrips()])
      .then(([data, profile, nextTrips]) => {
        setItems(data);
        setTrips(nextTrips);
        setWeightUnit(profile?.weight_unit ?? "kg");
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load items");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    void refresh();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setQty("1");
    setDescription("");
    setLink("");
    setImageUrl("");
    setWeight("");
    setCategory("");
    setEditorOpen(true);
  }

  const openEdit = useCallback(
    (item: ReusableItem) => {
      setEditing(item);
      setName(item.name);
      setQty(String(item.default_qty));
      setDescription(item.description ?? "");
      setLink(item.link ?? "");
      setImageUrl(item.image_url ?? "");
      setWeight(
        item.weight_grams === null
          ? ""
          : String(Number(fromGrams(item.weight_grams, weightUnit).toFixed(2))),
      );
      setCategory(item.category ?? "");
      setEditorOpen(true);
    },
    [weightUnit],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: validateName(name, "Item name"),
        defaultQty: parseQty(qty, "Default quantity"),
        description: description.trim() || null,
        link: link.trim() || null,
        imageUrl: imageUrl.trim() || null,
        weightGrams: weight.trim() === "" ? null : Math.round(toGrams(Number(weight), weightUnit)),
        category: category || null,
      };
      if (editing) {
        await updateItem(editing.id, payload);
        toast.success("Item updated");
      } else {
        await createItem(payload);
        toast.success("Item created");
      }
      setEditorOpen(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteItem(pendingDelete.id);
      toast.success("Item deleted");
      setPendingDelete(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete item");
    }
  }

  const visibleItems = filterEntriesByCategory(filterByName(items, query), categoryFilter);

  const sortedItems = useMemo(() => {
    const list = [...visibleItems];
    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => {
        const av = a.weight_grams ?? -1;
        const bv = b.weight_grams ?? -1;
        return sort === "weight-desc" ? bv - av : av - bv;
      });
    }
    return list;
  }, [visibleItems, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedItems = sortedItems.slice(pageStart, pageStart + PAGE_SIZE);

  const stats = useMemo(() => {
    const totalGrams = items.reduce((sum, item) => sum + (item.weight_grams ?? 0), 0);
    const withWeight = items.filter((item) => item.weight_grams !== null).length;
    const categories = new Set(items.map((item) => item.category).filter(Boolean)).size;
    return {
      totalGrams,
      withWeightPct: items.length === 0 ? 0 : Math.round((withWeight / items.length) * 100),
      categories,
    };
  }, [items]);

  const hasItems = !loading && items.length > 0;
  const hasMatches = sortedItems.length > 0;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Item Library"
        description="Reusable things you bring on trips."
        breadcrumb={[{ label: "Library" }, { label: "Items" }]}
      >
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" />
          Add item
        </Button>
      </PageHeader>

      {hasItems ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            icon={Package}
            value={String(items.length)}
            label="catalogued items"
            tone="bg-primary/10 text-primary"
          />
          <StatTile
            icon={Weight}
            value={formatWeight(stats.totalGrams, weightUnit)}
            label="total catalogue weight"
            tone="bg-packed-soft text-packed-soft-foreground"
          />
          <StatTile
            icon={Tags}
            value={String(stats.categories)}
            label="categories in use"
            tone="bg-with-me-soft text-with-me-soft-foreground"
          />
          <StatTile
            icon={BadgeCheck}
            value={`${stats.withWeightPct}%`}
            label="have a weight"
            tone="bg-warning-soft text-warning-soft-foreground"
          />
        </div>
      ) : null}

      {hasItems ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CategoryFilterChips
            entries={items}
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
            }}
            label="Filter items by category"
          />
          <div className="flex items-center gap-2">
            <ListSearchToolbar
              id="item-search"
              label="Search items"
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Search items"
            />
            <select
              aria-label="Sort items"
              className={cn(inputVariants({ variant: "md" }), "w-auto pr-8")}
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as ItemSort);
                setPage(1);
              }}
            >
              <option value="name">Sort: Name</option>
              <option value="weight-desc">Weight: High to low</option>
              <option value="weight-asc">Weight: Low to high</option>
            </select>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="No items yet"
            description="Add your first one to reuse it across trips."
            action={
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" />
                Add your first item
              </Button>
            }
          />
        </Card>
      ) : !hasMatches ? (
        <Card>
          {query.trim() ? (
            <EmptyState
              icon={SearchX}
              title={`No items match “${query}”.`}
              description="Try a different search term."
            />
          ) : (
            <EmptyState
              icon={Tags}
              title="No items in this category."
              description="Choose another category or add an item."
            />
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <HeadCell>Item</HeadCell>
                  <HeadCell className="hidden md:table-cell">Specification</HeadCell>
                  <HeadCell className="hidden sm:table-cell">Category</HeadCell>
                  <HeadCell align="right" className="hidden sm:table-cell">
                    Default quantity
                  </HeadCell>
                  <HeadCell align="right">Mass</HeadCell>
                  <HeadCell align="right">
                    <span className="sr-only">Actions</span>
                  </HeadCell>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ItemThumbnail item={item} />
                        <div className="flex min-w-0 flex-col">
                          <span className="font-medium text-foreground">{item.name}</span>
                          {item.link ? (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-xs text-primary underline"
                            >
                              {item.link}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="hidden max-w-xs px-4 py-3 text-sm text-muted-foreground md:table-cell">
                      {item.description ? (
                        <span className="line-clamp-2">{item.description}</span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-sm tabular-nums text-muted-foreground sm:table-cell">
                      {item.default_qty}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-foreground">
                      {item.weight_grams === null
                        ? "—"
                        : formatWeight(item.weight_grams, weightUnit)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <RecordAction
                          icon={ListPlus}
                          label="Add to trip"
                          onClick={() => setAddTarget(item)}
                        />
                        <RecordAction icon={Pencil} label="Edit" onClick={() => openEdit(item)} />
                        <RecordAction
                          icon={Trash2}
                          label="Delete"
                          onClick={() => setPendingDelete(item)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Showing {sortedItems.length === 0 ? 0 : pageStart + 1}&ndash;
              {Math.min(pageStart + PAGE_SIZE, sortedItems.length)} of {sortedItems.length}{" "}
              {sortedItems.length === 1 ? "item" : "items"}
            </span>
            {pageCount > 1 ? (
          <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft aria-hidden="true" />
                  Previous
                </Button>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit item" : "New item"}</DialogTitle>
              <DialogDescription>Library items can be added to any trip.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-qty">Default quantity</Label>
                <Input
                  id="item-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={qty}
                  onChange={(event) => setQty(event.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-category">Category</Label>
                <select
                  id="item-category"
                  className="h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem]"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ItemCategory | "")}
                >
                  <option value="">Uncategorised</option>
                  {ITEM_CATEGORY_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.categories.map((value) => (
                        <option key={value} value={value}>
                          {ITEM_CATEGORY_LABELS[value]}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-description">Description</Label>
                <Textarea
                  id="item-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional notes, model or colour"
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-link">Link</Label>
                <Input
                  id="item-link"
                  inputMode="url"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-image">Image URL</Label>
                <Input
                  id="item-image"
                  inputMode="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-weight">Weight ({weightUnit})</Label>
                <Input
                  id="item-weight"
                  type="number"
                  min={0}
                  step="0.01"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  placeholder={weightUnit === "kg" ? "e.g. 0.5" : "e.g. 1.1"}
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

      <AddToTripDialog
        open={addTarget !== null}
        onOpenChange={(open) => !open && setAddTarget(null)}
        trips={trips}
        subject={addTarget?.name ?? ""}
        onAdd={async (tripId) => {
          if (!addTarget) return;
          try {
            await addLibraryItemToTrip(tripId, addTarget.id, null);
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
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
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

export default function ItemsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
      <ItemsView />
    </Suspense>
  );
}
