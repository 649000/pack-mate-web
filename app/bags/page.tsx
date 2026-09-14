"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
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
  listBagContents,
  listBags,
  listItems,
  removeBagItem,
  updateBag,
} from "@/lib/data";
import type { ReusableBag, ReusableBagItem, ReusableItem } from "@/lib/types";
import { parseQty, validateName } from "@/lib/validation";

export function BagsView() {
  const [bags, setBags] = useState<ReusableBag[]>([]);
  const [items, setItems] = useState<ReusableItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReusableBag | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ReusableBag | null>(null);

  const [contentsBag, setContentsBag] = useState<ReusableBag | null>(null);
  const [contents, setContents] = useState<ReusableBagItem[]>([]);
  const [addItemId, setAddItemId] = useState("");
  const [addQty, setAddQty] = useState("1");

  function refresh() {
    return Promise.all([listBags(), listItems()])
      .then(([nextBags, nextItems]) => {
        setBags(nextBags);
        setItems(nextItems);
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
    setEditorOpen(true);
  }

  function openEdit(bag: ReusableBag) {
    setEditing(bag);
    setName(bag.name);
    setEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const bagName = validateName(name, "Bag name");
      if (editing) {
        await updateBag(editing.id, { name: bagName });
        toast.success("Bag updated");
      } else {
        await createBag({ name: bagName });
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Bags</h1>
          <p className="text-sm text-muted-foreground">
            Reusable containers and their usual contents.
          </p>
        </div>
        <Button onClick={openCreate}>Add bag</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : bags.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No bags yet. Add your first one.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {bags.map((bag) => (
            <Card key={bag.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <p className="flex-1 font-medium">{bag.name}</p>
                <Button variant="outline" size="sm" onClick={() => void openContents(bag)}>
                  Contents
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(bag)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPendingDelete(bag)}>
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit bag" : "New bag"}</DialogTitle>
              <DialogDescription>A bag is a container you reuse across trips.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bag-name">Name</Label>
                <Input
                  id="bag-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
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
    <RequireAuth>
      <AppShell>
        <BagsView />
      </AppShell>
    </RequireAuth>
  );
}
