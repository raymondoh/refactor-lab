"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InventoryItem } from "@/lib/types/business-owner";
import type {
  ActionResponse,
  createInventoryItemAction,
  updateInventoryItemAction,
  adjustInventoryQuantityAction,
  deleteInventoryItemAction
} from "@/app/dashboard/business-owner/actions";

const DEFAULT_ITEM_FORM = {
  name: "",
  sku: "",
  quantity: 0,
  reorderLevel: 0,
  unitCost: "",
  location: "",
  notes: ""
};

type ServerAction<T> = (input: T) => Promise<ActionResponse>;

type InventoryManagementPanelProps = {
  items: InventoryItem[];
  onCreateItem: typeof createInventoryItemAction;
  onUpdateItem: typeof updateInventoryItemAction;
  onAdjustQuantity: typeof adjustInventoryQuantityAction;
  onDeleteItem: typeof deleteInventoryItemAction;
};

export function InventoryManagementPanel({
  items,
  onCreateItem,
  onUpdateItem,
  onAdjustQuantity,
  onDeleteItem
}: InventoryManagementPanelProps) {
  const [newItem, setNewItem] = useState(DEFAULT_ITEM_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const handleServerAction = <T,>(action: ServerAction<T>, payload: T, successMessage: string, reset?: () => void) => {
    resetFeedback();
    startTransition(async () => {
      const result = await action(payload);
      if (result.success) {
        setMessage(result.message ?? successMessage);
        reset?.();
      } else {
        setError(result.error);
      }
    });
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newItem.name || !newItem.sku) {
      setError("Item name and SKU are required.");
      return;
    }
    const payload = {
      name: newItem.name,
      sku: newItem.sku,
      quantity: Number(newItem.quantity),
      reorderLevel: Number(newItem.reorderLevel),
      unitCost: newItem.unitCost ? Number(newItem.unitCost) : undefined,
      location: newItem.location || undefined,
      notes: newItem.notes || undefined
    };
    handleServerAction(onCreateItem as ServerAction<typeof payload>, payload, "Inventory item created", () => {
      setNewItem(DEFAULT_ITEM_FORM);
    });
  };

  const handleAdjust = (itemId: string, delta: number) => {
    handleServerAction(
      onAdjustQuantity as ServerAction<{ itemId: string; delta: number }>,
      { itemId, delta },
      "Inventory updated"
    );
  };

  const handleDelete = (itemId: string) => {
    if (!confirm("Remove this inventory item?")) return;
    handleServerAction(onDeleteItem as ServerAction<string>, itemId, "Inventory item removed");
  };

  const handleUpdateNotes = (item: InventoryItem, notes: string) => {
    handleServerAction(
      onUpdateItem as ServerAction<{ itemId: string; notes: string }>,
      { itemId: item.id, notes },
      "Inventory item updated"
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Tracker</CardTitle>
        <CardDescription>Maintain accurate stock levels for vans and warehouse supplies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(message || error) && (
          <div
            className={`rounded-md border px-4 py-2 text-sm ${
              message ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"
            }`}>
            {message ?? error}
          </div>
        )}

        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-6">
          <Input
            name="name"
            placeholder="Item name"
            value={newItem.name}
            onChange={event => setNewItem(prev => ({ ...prev, name: event.target.value }))}
            required
          />
          <Input
            name="sku"
            placeholder="SKU"
            value={newItem.sku}
            onChange={event => setNewItem(prev => ({ ...prev, sku: event.target.value }))}
            required
          />
          <Input
            name="quantity"
            type="number"
            placeholder="Qty"
            value={newItem.quantity}
            onChange={event => setNewItem(prev => ({ ...prev, quantity: Number(event.target.value) }))}
            min={0}
          />
          <Input
            name="reorderLevel"
            type="number"
            placeholder="Reorder"
            value={newItem.reorderLevel}
            onChange={event => setNewItem(prev => ({ ...prev, reorderLevel: Number(event.target.value) }))}
            min={0}
          />
          <Input
            name="unitCost"
            type="number"
            placeholder="Unit cost (£)"
            value={newItem.unitCost}
            onChange={event => setNewItem(prev => ({ ...prev, unitCost: event.target.value }))}
            min={0}
            step="0.01"
          />
          <Input
            name="location"
            placeholder="Location"
            value={newItem.location}
            onChange={event => setNewItem(prev => ({ ...prev, location: event.target.value }))}
          />
          <Input
            name="notes"
            className="md:col-span-5"
            placeholder="Notes"
            value={newItem.notes}
            onChange={event => setNewItem(prev => ({ ...prev, notes: event.target.value }))}
          />
          <div className="md:col-span-6 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Add inventory item"}
            </Button>
          </div>
        </form>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Reorder at</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No inventory recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map(item => {
                  const isLowStock = item.quantity <= item.reorderLevel;
                  return (
                    <TableRow key={item.id} className={isLowStock ? "bg-amber-50" : undefined}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.reorderLevel}</TableCell>
                      <TableCell className="text-right">£{(item.unitCost ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Input
                          defaultValue={item.notes ?? ""}
                          placeholder="Notes"
                          onBlur={event => handleUpdateNotes(item, event.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 md:flex-row">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAdjust(item.id, -1)}
                              disabled={isPending || item.quantity <= 0}
                              aria-label={`Decrease quantity for ${item.name}`}>
                              -
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAdjust(item.id, 1)}
                              disabled={isPending}
                              aria-label={`Increase quantity for ${item.name}`}>
                              +
                            </Button>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/5"
                            onClick={() => handleDelete(item.id)}
                            disabled={isPending}>
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
