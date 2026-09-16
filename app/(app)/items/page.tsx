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

  function openEdit(item: ReusableItem) {
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
  }

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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Items"
        description="Reusable things you bring on trips."
        breadcrumb={[{ label: "Library" }, { label: "Items" }]}
      >
        <Button onClick={openCreate}>Add item</Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Item library</CardTitle>
            <CardDescription>
              {items.length} {items.length === 1 ? "item" : "items"}
            </CardDescription>
          </CardHeading>
        </CardHeader>
        {!loading && items.length > 0 ? (
          <div className="flex flex-col gap-3 px-4 pb-3">
            <ListSearch
              id="item-search"
              label="Search items"
              value={query}
              onChange={setQuery}
              placeholder="e.g. passport"
            />
            <CategoryFilterChips
              entries={items}
              value={categoryFilter}
              onChange={setCategoryFilter}
              label="Filter items by category"
            />
          </div>
        ) : null}
        <CardTable>
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No items yet. Add your first one.
            </div>
          ) : visibleItems.length === 0 ? (
            query.trim() ? (
              <ListSearchEmpty noun="items" query={query} />
            ) : (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No items in this category.
              </div>
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden sm:table-cell">Default quantity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="size-10 shrink-0 rounded-md border object-cover"
                          />
                        ) : null}
                        <div className="flex min-w-0 flex-col">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            <CategoryBadge category={item.category} />
                          </div>
                          {item.description ? (
                            <span className="truncate text-xs text-muted-foreground">
                              {item.description}
                            </span>
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
                          {item.weight_grams !== null ? (
                            <span className="text-xs text-muted-foreground">
                              {formatWeight(item.weight_grams, weightUnit)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      Default quantity: {item.default_qty}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPendingDelete(item)}>
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
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <ItemsView />
    </Suspense>
  );
}
