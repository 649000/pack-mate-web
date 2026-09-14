"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
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
import { createItem, deleteItem, listItems, updateItem } from "@/lib/data";
import type { ReusableItem } from "@/lib/types";
import { parseQty, validateName } from "@/lib/validation";

export function ItemsView() {
  const [items, setItems] = useState<ReusableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReusableItem | null>(null);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ReusableItem | null>(null);

  function refresh() {
    return listItems()
      .then((data) => {
        setItems(data);
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
    setEditorOpen(true);
  }

  function openEdit(item: ReusableItem) {
    setEditing(item);
    setName(item.name);
    setQty(String(item.default_qty));
    setEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: validateName(name, "Item name"),
        defaultQty: parseQty(qty, "Default quantity"),
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
        <CardTable>
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No items yet. Add your first one.
            </div>
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
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
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
  return <ItemsView />;
}
