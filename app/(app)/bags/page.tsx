"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ListSearch, ListSearchEmpty } from "@/components/list-search";
import { PageHeader } from "@/components/layouts/page-header";
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
import { parseQty, validateName } from "@/lib/validation";
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

  function openEdit(bag: ReusableBag) {
    setEditing(bag);
    setName(bag.name);
    setLimit(
      bag.weight_limit_grams === null
        ? ""
        : String(Number(fromGrams(bag.weight_limit_grams, weightUnit).toFixed(2))),
    );
    setEditorOpen(true);
  }

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

  async function openContents(bag: ReusableBag) {
    setContentsBag(bag);
    setAddItemId("");
    setAddQty("1");
    try {
      setContents(await listBagContents(bag.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load contents");
    }
  }

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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Bags"
        description="Reusable containers and their usual contents."
        breadcrumb={[{ label: "Library" }, { label: "Bags" }]}
      >
        <Button onClick={openCreate}>Add bag</Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Bag library</CardTitle>
            <CardDescription>
              {bags.length} {bags.length === 1 ? "bag" : "bags"}
            </CardDescription>
          </CardHeading>
        </CardHeader>
        {!loading && bags.length > 0 ? (
          <div className="px-4 pb-3">
            <ListSearch
              id="bag-search"
              label="Search bags"
              value={query}
              onChange={setQuery}
              placeholder="e.g. daypack"
            />
          </div>
        ) : null}
        <CardTable>
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : bags.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No bags yet. Add your first one.
            </div>
          ) : visibleBags.length === 0 ? (
            <ListSearchEmpty noun="bags" query={query} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bag</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBags.map((bag) => (
                  <TableRow key={bag.id}>
                    <TableCell>
                      <span className="font-medium">{bag.name}</span>
                      {bag.weight_limit_grams !== null ? (
                        <span className="block text-xs text-muted-foreground">
                          Limit {formatWeight(bag.weight_limit_grams, weightUnit)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => void openContents(bag)}>
                          Contents
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(bag)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPendingDelete(bag)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardTable>
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
                <select
                  id="content-item"
                  className="h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem]"
                  value={addItemId}
                  onChange={(event) => setAddItemId(event.target.value)}
                >
                  <option value="">Select an item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
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
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <BagsView />
    </Suspense>
  );
}
