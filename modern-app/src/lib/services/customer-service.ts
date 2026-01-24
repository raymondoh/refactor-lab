// src/lib/services/customer-service.ts
import { config } from "@/lib/config/app-mode";
import { BusinessCustomersCollection } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";
import type {
  CustomerRecord,
  CreateCustomerRecordInput,
  UpdateCustomerRecordInput,
  CustomerInteraction,
  RecordCustomerInteractionInput
} from "@/lib/types/business-owner";
import { randomUUID } from "crypto";
import { toDate } from "@/lib/utils/to-date";

interface CustomerService {
  listCustomers(ownerId: string): Promise<CustomerRecord[]>;
  findCustomerByContact(
    ownerId: string,
    contact: { email?: string | null; phone?: string | null }
  ): Promise<CustomerRecord | null>;
  createCustomer(ownerId: string, input: CreateCustomerRecordInput): Promise<CustomerRecord>;
  updateCustomer(ownerId: string, customerId: string, updates: UpdateCustomerRecordInput): Promise<CustomerRecord>;
  recordInteraction(
    ownerId: string,
    customerId: string,
    input: RecordCustomerInteractionInput & { createdBy: string }
  ): Promise<CustomerRecord>;
  deleteCustomer(ownerId: string, customerId: string): Promise<void>;
}

type CustomerRecordDocument = Omit<CustomerRecord, "id" | "createdAt" | "updatedAt" | "interactionHistory"> & {
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
  interactionHistory: Array<Omit<CustomerInteraction, "createdAt"> & { createdAt: FirebaseFirestore.Timestamp | Date }>;
};

function toCustomerRecord(id: string, data: CustomerRecordDocument): CustomerRecord {
  const createdAt = toDate(data.createdAt)!;
  const updatedAt = toDate(data.updatedAt)!;

  return {
    id,
    ownerId: data.ownerId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    lastServiceDate: toDate(data.lastServiceDate),
    totalJobs: data.totalJobs ?? 0,
    totalSpend: data.totalSpend ?? 0,
    notes: data.notes,
    interactionHistory: (data.interactionHistory || []).map(entry => ({
      ...entry,
      createdAt: toDate(entry.createdAt)!,
      followUpDate: toDate(entry.followUpDate)
    })),
    createdAt,
    updatedAt
  };
}

class FirebaseCustomerService implements CustomerService {
  async listCustomers(ownerId: string): Promise<CustomerRecord[]> {
    const snapshot = await BusinessCustomersCollection().where("ownerId", "==", ownerId).orderBy("name").get();

    const customers = snapshot.docs.map(doc => toCustomerRecord(doc.id, doc.data() as CustomerRecordDocument));
    // Return domain objects (with Date fields), no serialization here
    return customers;
  }

  async findCustomerByContact(
    ownerId: string,
    contact: { email?: string | null; phone?: string | null }
  ): Promise<CustomerRecord | null> {
    const collection = BusinessCustomersCollection();

    if (contact.email) {
      const emailSnapshot = await collection
        .where("ownerId", "==", ownerId)
        .where("email", "==", contact.email)
        .limit(1)
        .get();

      if (!emailSnapshot.empty) {
        const match = emailSnapshot.docs[0];
        return toCustomerRecord(match.id, match.data() as CustomerRecordDocument);
      }
    }

    if (contact.phone) {
      const phoneSnapshot = await collection
        .where("ownerId", "==", ownerId)
        .where("phone", "==", contact.phone)
        .limit(1)
        .get();

      if (!phoneSnapshot.empty) {
        const match = phoneSnapshot.docs[0];
        return toCustomerRecord(match.id, match.data() as CustomerRecordDocument);
      }
    }

    return null;
  }

  async createCustomer(ownerId: string, input: CreateCustomerRecordInput): Promise<CustomerRecord> {
    const now = new Date();
    const doc = await BusinessCustomersCollection().add({
      ownerId,
      ...input,
      lastServiceDate: input.lastServiceDate ?? null,
      totalJobs: 0,
      totalSpend: 0,
      interactionHistory: [],
      createdAt: now,
      updatedAt: now
    });

    const snapshot = await doc.get();
    return toCustomerRecord(snapshot.id, snapshot.data() as CustomerRecordDocument);
  }

  async updateCustomer(
    ownerId: string,
    customerId: string,
    updates: UpdateCustomerRecordInput
  ): Promise<CustomerRecord> {
    const ref = BusinessCustomersCollection().doc(customerId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new Error("Customer record not found");
    }
    const data = snapshot.data() as CustomerRecordDocument;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to update this customer");
    }

    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ) as UpdateCustomerRecordInput & { updatedAt: Date };
    sanitizedUpdates.updatedAt = new Date();

    await ref.update({ ...sanitizedUpdates });
    const updatedSnapshot = await ref.get();
    return toCustomerRecord(updatedSnapshot.id, updatedSnapshot.data() as CustomerRecordDocument);
  }

  async recordInteraction(
    ownerId: string,
    customerId: string,
    input: RecordCustomerInteractionInput & { createdBy: string }
  ): Promise<CustomerRecord> {
    const ref = BusinessCustomersCollection().doc(customerId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new Error("Customer record not found");
    }
    const data = snapshot.data() as CustomerRecordDocument;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to update this customer");
    }

    const history = data.interactionHistory || [];

    const entry: CustomerInteraction = {
      id: randomUUID(),
      note: input.note,
      // Optional fields: only set them when present
      ...(input.jobId ? { jobId: input.jobId } : {}),
      ...(typeof input.amount === "number" ? { amount: input.amount } : {}),
      followUpDate: input.followUpDate ?? null,
      createdBy: input.createdBy,
      createdAt: new Date()
    };

    const nextHistory = [...history, entry];
    const nextTotalJobs = input.jobId ? (data.totalJobs ?? 0) + 1 : (data.totalJobs ?? 0);
    const nextTotalSpend = input.amount ? (data.totalSpend ?? 0) + input.amount : (data.totalSpend ?? 0);
    const nextLastServiceDate = input.followUpDate ?? data.lastServiceDate ?? null;

    await ref.update({
      interactionHistory: nextHistory,
      totalJobs: nextTotalJobs,
      totalSpend: nextTotalSpend,
      lastServiceDate: nextLastServiceDate,
      updatedAt: new Date()
    });

    const updatedSnapshot = await ref.get();
    return toCustomerRecord(updatedSnapshot.id, updatedSnapshot.data() as CustomerRecordDocument);
  }

  async deleteCustomer(ownerId: string, customerId: string): Promise<void> {
    const ref = BusinessCustomersCollection().doc(customerId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return;
    const data = snapshot.data() as CustomerRecordDocument;
    if (data.ownerId !== ownerId) {
      throw new Error("You do not have permission to delete this customer");
    }
    await ref.delete();
  }
}

class MockCustomerService implements CustomerService {
  private customersByOwner = new Map<string, CustomerRecord[]>();

  private clone(record: CustomerRecord): CustomerRecord {
    return {
      ...record,
      interactionHistory: record.interactionHistory.map(entry => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        followUpDate: entry.followUpDate ? new Date(entry.followUpDate) : null
      })),
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt)
    };
  }

  private getCollection(ownerId: string): CustomerRecord[] {
    if (!this.customersByOwner.has(ownerId)) {
      this.customersByOwner.set(ownerId, []);
    }
    return this.customersByOwner.get(ownerId)!;
  }

  async listCustomers(ownerId: string): Promise<CustomerRecord[]> {
    return this.getCollection(ownerId).map(record => this.clone(record));
  }

  async findCustomerByContact(
    ownerId: string,
    contact: { email?: string | null; phone?: string | null }
  ): Promise<CustomerRecord | null> {
    const match = this.getCollection(ownerId).find(record => {
      const emailMatches = contact.email && record.email === contact.email;
      const phoneMatches = contact.phone && record.phone === contact.phone;
      return Boolean(emailMatches || phoneMatches);
    });

    return match ? this.clone(match) : null;
  }

  async createCustomer(ownerId: string, input: CreateCustomerRecordInput): Promise<CustomerRecord> {
    const now = new Date();
    const record: CustomerRecord = {
      id: randomUUID(),
      ownerId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      lastServiceDate: input.lastServiceDate ?? null,
      totalJobs: 0,
      totalSpend: 0,
      notes: input.notes,
      interactionHistory: [],
      createdAt: now,
      updatedAt: now
    };
    this.getCollection(ownerId).push(record);
    return this.clone(record);
  }

  async updateCustomer(
    ownerId: string,
    customerId: string,
    updates: UpdateCustomerRecordInput
  ): Promise<CustomerRecord> {
    const records = this.getCollection(ownerId);
    const index = records.findIndex(record => record.id === customerId);
    if (index === -1) throw new Error("Customer record not found");
    const existing = records[index];
    const updated: CustomerRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    if (updates.lastServiceDate === undefined) {
      updated.lastServiceDate = existing.lastServiceDate;
    }
    records[index] = updated;
    return this.clone(updated);
  }

  async recordInteraction(
    ownerId: string,
    customerId: string,
    input: RecordCustomerInteractionInput & { createdBy: string }
  ): Promise<CustomerRecord> {
    const records = this.getCollection(ownerId);
    const index = records.findIndex(record => record.id === customerId);
    if (index === -1) throw new Error("Customer record not found");
    const existing = records[index];
    const entry: CustomerInteraction = {
      id: randomUUID(),
      note: input.note,
      jobId: input.jobId,
      amount: input.amount,
      followUpDate: input.followUpDate ?? null,
      createdBy: input.createdBy,
      createdAt: new Date()
    };
    existing.interactionHistory = [...existing.interactionHistory, entry];
    if (input.jobId) {
      existing.totalJobs += 1;
    }
    if (input.amount) {
      existing.totalSpend += input.amount;
    }
    if (input.followUpDate) {
      existing.lastServiceDate = input.followUpDate;
    }
    existing.updatedAt = new Date();
    records[index] = existing;
    return this.clone(existing);
  }

  async deleteCustomer(ownerId: string, customerId: string): Promise<void> {
    const records = this.getCollection(ownerId);
    const index = records.findIndex(record => record.id === customerId);
    if (index !== -1) {
      records.splice(index, 1);
    }
  }
}

class CustomerServiceFactory {
  private static instance: CustomerService | null = null;

  static getInstance(): CustomerService {
    if (this.instance) return this.instance;

    if (config.isMockMode) {
      logger.info("🔧 CustomerServiceFactory: Using MockCustomerService");
      this.instance = new MockCustomerService();
    } else {
      logger.info("🔧 CustomerServiceFactory: Using FirebaseCustomerService");
      this.instance = new FirebaseCustomerService();
    }

    return this.instance;
  }
}

export const customerService = CustomerServiceFactory.getInstance();
export type { CustomerService };
