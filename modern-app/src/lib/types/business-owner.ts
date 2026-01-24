// src/lib/types/business-owner.ts
// Shared domain models for business owner operational data

export interface TeamMember {
  id: string;
  ownerId: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  active: boolean;
  assignedJobs: string[];
  certifications?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamMemberInput {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  certifications?: string[];
}

export interface UpdateTeamMemberInput extends Partial<CreateTeamMemberInput> {
  active?: boolean;
  assignedJobs?: string[];
}

export interface InventoryItem {
  id: string;
  ownerId: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  unitCost?: number;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInventoryItemInput {
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  unitCost?: number;
  location?: string;
  notes?: string;
}

export type UpdateInventoryItemInput = Partial<CreateInventoryItemInput>;

export interface CustomerInteraction {
  id: string;
  note: string;
  createdAt: Date;
  createdBy: string;
  followUpDate?: Date | null;
  jobId?: string;
  amount?: number;
}

export interface CustomerRecord {
  id: string;
  ownerId: string;
  name: string;
  email?: string;
  phone?: string;
  lastServiceDate?: Date | null;
  totalJobs: number;
  totalSpend: number;
  notes?: string;
  interactionHistory: CustomerInteraction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerRecordInput {
  name: string;
  email?: string;
  phone?: string;
  lastServiceDate?: Date | null;
  notes?: string;
}

export interface UpdateCustomerRecordInput extends Partial<CreateCustomerRecordInput> {
  totalJobs?: number;
  totalSpend?: number;
}

export interface RecordCustomerInteractionInput {
  note: string;
  followUpDate?: Date | null;
  jobId?: string;
  amount?: number;
}

