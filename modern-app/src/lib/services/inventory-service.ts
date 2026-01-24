// src/lib/services/inventory-service.ts
import { config } from "@/lib/config/app-mode";
import { BusinessInventoryCollection } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";
import type { InventoryItem, CreateInventoryItemInput, UpdateInventoryItemInput } from "@/lib/types/business-owner";
import { randomUUID } from "crypto";

interface InventoryService {
  listItems(ownerId: string): Promise<InventoryItem[]>;
  createItem(ownerId: string, input: CreateInventoryItemInput): Promise<InventoryItem>;
  updateItem(ownerId: string, itemId: string, updates: UpdateInventoryItemInput): Promise<InventoryItem>;
  adjustQuantity(ownerId: string, itemId: string, delta: number): Promise<InventoryItem>;
  deleteItem(ownerId: string, itemId: string): Promise<void>;
}

type InventoryItemRecord = Omit<InventoryItem, "id" | "createdAt" | "updatedAt"> & {
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
};

function mapSnapshot(id: string, data: InventoryItemRecord): InventoryItem {
  const createdAt = data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate();
  const updatedAt = data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt.toDate();
  return {
    id,
    ownerId: data.ownerId,
    name: data.name,
    sku: data.sku,
    quantity: data.quantity,
    reorderLevel: data.reorderLevel,
    unitCost: data.unitCost,
    location: data.location,
    notes: data.notes,
    createdAt,
    updatedAt
  };
}

class FirebaseInventoryService implements InventoryService {
  async listItems(ownerId: string): Promise<InventoryItem[]> {
    const snapshot = await BusinessInventoryCollection().where("ownerId", "==", ownerId).orderBy("name").get();

    const items = snapshot.docs.map(doc => mapSnapshot(doc.id, doc.data() as InventoryItemRecord));
    // Service layer returns domain objects with Date fields – no JSON serialization here
    return items;
  }

  async createItem(ownerId: string, input: CreateInventoryItemInput): Promise<InventoryItem> {
    const now = new Date();
    const doc = await BusinessInventoryCollection().add({
      ownerId,
      ...input,
      createdAt: now,
      updatedAt: now
    });

    const snapshot = await doc.get();
    return mapSnapshot(snapshot.id, snapshot.data() as InventoryItemRecord);
  }

  async updateItem(ownerId: string, itemId: string, updates: UpdateInventoryItemInput): Promise<InventoryItem> {
    const ref = BusinessInventoryCollection().doc(itemId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new Error("Inventory item not found");
    }
    const data = snapshot.data() as InventoryItemRecord;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to update this item");
    }

    const sanitizedUpdates = { ...updates } as UpdateInventoryItemInput & { updatedAt: Date };
    sanitizedUpdates.updatedAt = new Date();

    await ref.update({ ...sanitizedUpdates });
    const updatedSnapshot = await ref.get();
    return mapSnapshot(updatedSnapshot.id, updatedSnapshot.data() as InventoryItemRecord);
  }

  async adjustQuantity(ownerId: string, itemId: string, delta: number): Promise<InventoryItem> {
    const ref = BusinessInventoryCollection().doc(itemId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new Error("Inventory item not found");
    }
    const data = snapshot.data() as InventoryItemRecord;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to update this item");
    }

    const nextQuantity = Math.max(0, (data.quantity ?? 0) + delta);
    await ref.update({
      quantity: nextQuantity,
      updatedAt: new Date()
    });
    const updatedSnapshot = await ref.get();
    return mapSnapshot(updatedSnapshot.id, updatedSnapshot.data() as InventoryItemRecord);
  }

  async deleteItem(ownerId: string, itemId: string): Promise<void> {
    const ref = BusinessInventoryCollection().doc(itemId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return;
    const data = snapshot.data() as InventoryItemRecord;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to delete this item");
    }
    await ref.delete();
  }
}

class MockInventoryService implements InventoryService {
  private itemsByOwner = new Map<string, InventoryItem[]>();

  private clone(item: InventoryItem): InventoryItem {
    return {
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    };
  }

  private getCollection(ownerId: string): InventoryItem[] {
    if (!this.itemsByOwner.has(ownerId)) {
      this.itemsByOwner.set(ownerId, []);
    }
    return this.itemsByOwner.get(ownerId)!;
  }

  async listItems(ownerId: string): Promise<InventoryItem[]> {
    return this.getCollection(ownerId).map(item => this.clone(item));
  }

  async createItem(ownerId: string, input: CreateInventoryItemInput): Promise<InventoryItem> {
    const now = new Date();
    const item: InventoryItem = {
      id: randomUUID(),
      ownerId,
      name: input.name,
      sku: input.sku,
      quantity: input.quantity,
      reorderLevel: input.reorderLevel,
      unitCost: input.unitCost,
      location: input.location,
      notes: input.notes,
      createdAt: now,
      updatedAt: now
    };
    this.getCollection(ownerId).push(item);
    return this.clone(item);
  }

  async updateItem(ownerId: string, itemId: string, updates: UpdateInventoryItemInput): Promise<InventoryItem> {
    const items = this.getCollection(ownerId);
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) throw new Error("Inventory item not found");
    const existing = items[index];
    const updated: InventoryItem = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    if (updates.quantity !== undefined) {
      updated.quantity = Math.max(0, updates.quantity);
    }
    items[index] = updated;
    return this.clone(updated);
  }

  async adjustQuantity(ownerId: string, itemId: string, delta: number): Promise<InventoryItem> {
    const items = this.getCollection(ownerId);
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) throw new Error("Inventory item not found");
    const existing = items[index];
    existing.quantity = Math.max(0, (existing.quantity ?? 0) + delta);
    existing.updatedAt = new Date();
    items[index] = existing;
    return this.clone(existing);
  }

  async deleteItem(ownerId: string, itemId: string): Promise<void> {
    const items = this.getCollection(ownerId);
    const index = items.findIndex(item => item.id === itemId);
    if (index !== -1) {
      items.splice(index, 1);
    }
  }
}

class InventoryServiceFactory {
  private static instance: InventoryService | null = null;

  static getInstance(): InventoryService {
    if (this.instance) return this.instance;

    if (config.isMockMode) {
      logger.info("🔧 InventoryServiceFactory: Using MockInventoryService");
      this.instance = new MockInventoryService();
    } else {
      logger.info("🔧 InventoryServiceFactory: Using FirebaseInventoryService");
      this.instance = new FirebaseInventoryService();
    }

    return this.instance;
  }
}

export const inventoryService = InventoryServiceFactory.getInstance();
export type { InventoryService };
