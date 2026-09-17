"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Columns3, ListTree, Luggage, PackageOpen, Pencil, Plus, Trash2 } from "lucide-react";
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
import { LibraryPicker, type LibraryPickerOption } from "@/components/library-picker";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  createBag,
  deleteBag,
  getProfile,
  listBagContents,
  listBags,
  listItems,
  removeBagItem,
  updateBag,
} from "@/lib/data";
import type { DisplayWeightUnit, ReusableBag, ReusableBagItem, ReusableItem } from "@/lib/types";
import { filterByName } from "@/lib/packing";
import { parseQty, validateName, ITEM_CATEGORY_LABELS } from "@/lib/validation";
import { formatWeight, fromGrams, toGrams } from "@/lib/weight";

export function BagsView() {
  const [bags, setBags] = useState<ReusableBag[]>([]);
  const [items, setItems] = useState<ReusableItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReusableBag | null>(null);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [weightUnit, setWeightUnit] = useState<DisplayWeightUnit>("kg");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ReusableBag | null>(null);

  const [contentsBag, setContentsBag] = useState<ReusableBag | null>(null);
  const [contents, setContents] = useState<ReusableBagItem[]>([]);
  const [addItemId, setAddItemId] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  function refresh() {
    return Promise.all([listBags(), listItems(), getProfile()])
      .then(([nextBags, nextItems, profile]) => {
        setBags(nextBags);
        setItems(nextItems);
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

  function openCreate() {
    setEditing(null);
    setName("");
    setLimit("");
    setEditorOpen(true);
  }

  const openEdit = useCallback(
    (bag: ReusableBag) => {
      setEditing(bag);
      setName(bag.name);
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove item");
    }
  }

  const visibleBags = filterByName(bags, query);

  const itemOptions = useMemo<LibraryPickerOption[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        detail: item.category ? ITEM_CATEGORY_LABELS[item.category] : undefined,
      })),
    [items],
  );

  const columns = useMemo<ColumnDef<ReusableBag>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        meta: { headerTitle: "Bag" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Bag" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
              <Luggage className="size-4" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="font-medium">{row.original.name}</span>
              {row.original.weight_limit_grams !== null ? (
                <span className="text-xs text-muted-foreground">
                  Limit {formatWeight(row.original.weight_limit_grams, weightUnit)}
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <RecordAction
              icon={ListTree}
              label="Contents"
              onClick={() => void openContents(row.original)}
            />
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
    [openContents, openEdit, weightUnit],
  );

  const table = useReactTable({
    data: visibleBags,
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
        title="Bags"
        description="Reusable containers and their usual contents."
        breadcrumb={[{ label: "Library" }, { label: "Bags" }]}
      >
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" />
          Add bag
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Bag library</CardTitle>
            <CardDescription>
              {bags.length} {bags.length === 1 ? "bag" : "bags"}
            </CardDescription>
          </CardHeading>
          {!loading && bags.length > 0 ? (
            <CardToolbar>
              <ListSearchToolbar
                id="bag-search"
                label="Search bags"
                value={query}
                onChange={setQuery}
                placeholder="Search bags"
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
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : bags.length === 0 ? (
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
        ) : visibleBags.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={`No bags match “${query}”.`}
            description="Try a different search term."
          />
        ) : (
          <DataGrid table={table} recordCount={visibleBags.length} tableLayout={{ width: "auto" }}>
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
                  <span className="text-muted-foreground">x{row.qty}</span>
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
