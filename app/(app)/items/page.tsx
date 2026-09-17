"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Columns3, Package, Pencil, Plus, SearchX, Tags, Trash2 } from "lucide-react";
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
import { ListSearchToolbar } from "@/components/list-search";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridColumnVisibility } from "@/components/ui/data-grid-column-visibility";
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
import { CategoryBadge } from "@/components/packing/category-badge";
import { CategoryFilterChips } from "@/components/packing/category-filter-chips";
import { createItem, deleteItem, getProfile, listItems, updateItem } from "@/lib/data";
import { filterByName, filterEntriesByCategory, type CategoryFilter } from "@/lib/packing";
import type { DisplayWeightUnit, ItemCategory, ReusableItem } from "@/lib/types";
import {
  ITEM_CATEGORY_GROUPS,
  ITEM_CATEGORY_LABELS,
  parseQty,
  validateName,
} from "@/lib/validation";
import { formatWeight, fromGrams, toGrams } from "@/lib/weight";

function ItemThumbnail({ item }: { item: ReusableItem }) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt={item.name}
        className="size-10 shrink-0 rounded-md border object-cover"
      />
    );
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
      <Package className="size-4" aria-hidden="true" />
    </span>
  );
}

export function ItemsView() {
  const [items, setItems] = useState<ReusableItem[]>([]);
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
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ReusableItem | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  function refresh() {
    return Promise.all([listItems(), getProfile()])
      .then(([data, profile]) => {
        setItems(data);
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

  const columns = useMemo<ColumnDef<ReusableItem>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        meta: { headerTitle: "Item" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Item" />,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-3">
              <ItemThumbnail item={item} />
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  <CategoryBadge category={item.category} />
                </div>
                {item.description ? (
                  <span className="truncate text-xs text-muted-foreground">{item.description}</span>
                ) : null}
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
          );
        },
      },
      {
        id: "default_qty",
        accessorKey: "default_qty",
        meta: {
          headerTitle: "Default quantity",
          headerClassName: "hidden sm:table-cell",
          cellClassName: "hidden sm:table-cell",
        },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Default quantity" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.default_qty}</span>
        ),
      },
      {
        id: "weight_grams",
        accessorKey: "weight_grams",
        meta: {
          headerTitle: "Weight",
          headerClassName: "hidden sm:table-cell",
          cellClassName: "hidden sm:table-cell",
        },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Weight" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.weight_grams === null
              ? "—"
              : formatWeight(row.original.weight_grams, weightUnit)}
          </span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <RecordAction icon={Pencil} label="Edit" onClick={() => openEdit(row.original)} />
            <RecordAction
              icon={Trash2}
              label="Delete"
              onClick={() => setPendingDelete(row.original)}
            />
          </div>
        ),
      },
    ],
    [openEdit, weightUnit],
  );

  const table = useReactTable({
    data: visibleItems,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Items"
        description="Reusable things you bring on trips."
        breadcrumb={[{ label: "Library" }, { label: "Items" }]}
      >
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" />
          Add item
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Item library</CardTitle>
            <CardDescription>
              {items.length} {items.length === 1 ? "item" : "items"}
            </CardDescription>
          </CardHeading>
          {!loading && items.length > 0 ? (
            <CardToolbar>
              <ListSearchToolbar
                id="item-search"
                label="Search items"
                value={query}
                onChange={setQuery}
                placeholder="Search items"
              />
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button variant="outline" size="sm">
                    <Columns3 aria-hidden="true" />
                    Columns
                  </Button>
                }
              />
            </CardToolbar>
          ) : null}
        </CardHeader>
        {!loading && items.length > 0 ? (
          <div className="px-4 pb-3">
            <CategoryFilterChips
              entries={items}
              value={categoryFilter}
              onChange={setCategoryFilter}
              label="Filter items by category"
            />
          </div>
        ) : null}
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : items.length === 0 ? (
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
        ) : visibleItems.length === 0 ? (
          query.trim() ? (
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
          )
        ) : (
          <DataGrid table={table} recordCount={visibleItems.length} tableLayout={{ width: "auto" }}>
            <div className="overflow-x-auto">
              <DataGridTable />
            </div>
          </DataGrid>
        )}
      </Card>

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
