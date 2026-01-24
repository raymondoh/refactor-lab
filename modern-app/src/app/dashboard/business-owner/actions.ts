"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";
import { teamService } from "@/lib/services/team-service";
import { inventoryService } from "@/lib/services/inventory-service";
import { customerService } from "@/lib/services/customer-service";

const BUSINESS_OWNER_PATHS = [
  "/dashboard/business-owner",
  "/dashboard/business-owner/team",
  "/dashboard/business-owner/inventory",
  "/dashboard/business-owner/customers"
] as const;

export type ActionResponse =
  | { success: true; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireBusinessOwner() {
  const session = await requireSession();
  if (session.user.role !== "business_owner" && session.user.role !== "admin") {
    throw new Error("Only business owners or admins can perform this action");
  }
  return { session, ownerId: session.user.id };
}

async function revalidate(...paths: string[]) {
  const unique = new Set<string>([...BUSINESS_OWNER_PATHS, ...paths]);
  await Promise.all(Array.from(unique).map(path => revalidatePath(path)));
}

function handleZodError(error: z.ZodError): ActionResponse {
  const { fieldErrors } = error.flatten();
  return {
    success: false,
    error: "Validation failed",
    fieldErrors: Object.fromEntries(
      Object.entries(fieldErrors).map(([key, value]) => {
        // This check ensures we only call .filter on actual arrays.
        if (Array.isArray(value)) {
          return [key, value.filter(Boolean)];
        }
        // If a field has nested errors (or is undefined), default to an empty error array.
        return [key, []];
      })
    )
  };
}

const optionalString = z
  .string()
  .trim()
  .transform(value => (value.length === 0 ? undefined : value))
  .optional();

const createTeamMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role: z.string().trim().min(1, "Role is required"),
  email: optionalString.pipe(z.string().email().optional()),
  phone: optionalString,
  certifications: z.array(z.string().trim()).optional()
});

const updateTeamMemberSchema = createTeamMemberSchema.partial().extend({
  memberId: z.string().min(1, "Member ID is required"),
  active: z.boolean().optional()
});

const assignJobSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  jobId: z.string().trim().min(1, "Job ID is required")
});

const identifierSchema = z.object({ id: z.string().min(1, "Identifier is required") });

const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  quantity: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  unitCost: z.coerce.number().min(0).optional(),
  location: optionalString,
  notes: optionalString
});

const updateInventoryItemSchema = createInventoryItemSchema.partial().extend({
  itemId: z.string().min(1, "Item ID is required")
});

const adjustInventorySchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  delta: z.coerce.number().int()
});

const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  email: optionalString.pipe(z.string().email().optional()),
  phone: optionalString,
  lastServiceDate: optionalString,
  notes: optionalString
});

const updateCustomerSchema = createCustomerSchema.partial().extend({
  customerId: z.string().min(1, "Customer ID is required"),
  totalJobs: z.coerce.number().int().min(0).optional(),
  totalSpend: z.coerce.number().min(0).optional()
});

const recordInteractionSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  note: z.string().trim().min(1, "Interaction notes are required"),
  followUpDate: optionalString,
  jobId: optionalString,
  amount: z.coerce.number().min(0).optional()
});

export async function createTeamMemberAction(input: unknown): Promise<ActionResponse> {
  const parsed = createTeamMemberSchema.safeParse(input);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    await teamService.createMember(ownerId, {
      ...parsed.data,
      email: parsed.data.email,
      phone: parsed.data.phone
    });
    await revalidate("/dashboard/business-owner/team");
    return { success: true, message: "Team member created" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateTeamMemberAction(input: unknown): Promise<ActionResponse> {
  const parsed = updateTeamMemberSchema.safeParse(input);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    const { memberId, ...updates } = parsed.data;
    await teamService.updateMember(ownerId, memberId, updates);
    await revalidate("/dashboard/business-owner/team");
    return { success: true, message: "Team member updated" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function assignJobToMemberAction(input: unknown): Promise<ActionResponse> {
  const parsed = assignJobSchema.safeParse(input);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    await teamService.assignJob(ownerId, parsed.data.memberId, parsed.data.jobId);
    await revalidate("/dashboard/business-owner/team");
    return { success: true, message: "Job assigned" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteTeamMemberAction(input: unknown): Promise<ActionResponse> {
  const parsed = identifierSchema.safeParse({ id: input });
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    await teamService.deleteMember(ownerId, parsed.data.id);
    await revalidate("/dashboard/business-owner/team");
    return { success: true, message: "Team member removed" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createInventoryItemAction(input: unknown): Promise<ActionResponse> {
  const parsed = createInventoryItemSchema.safeParse(input);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    await inventoryService.createItem(ownerId, parsed.data);
    await revalidate("/dashboard/business-owner/inventory");
    return { success: true, message: "Inventory item created" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateInventoryItemAction(input: unknown): Promise<ActionResponse> {
  const parsed = updateInventoryItemSchema.safeParse(input);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    const { itemId, ...updates } = parsed.data;
    await inventoryService.updateItem(ownerId, itemId, updates);
    await revalidate("/dashboard/business-owner/inventory");
    return { success: true, message: "Inventory item updated" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function adjustInventoryQuantityAction(input: unknown): Promise<ActionResponse> {
  const parsed = adjustInventorySchema.safeParse(input);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    await inventoryService.adjustQuantity(ownerId, parsed.data.itemId, parsed.data.delta);
    await revalidate("/dashboard/business-owner/inventory");
    return { success: true, message: "Inventory quantity updated" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteInventoryItemAction(input: unknown): Promise<ActionResponse> {
  const parsed = identifierSchema.safeParse({ id: input });
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    await inventoryService.deleteItem(ownerId, parsed.data.id);
    await revalidate("/dashboard/business-owner/inventory");
    return { success: true, message: "Inventory item removed" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createCustomerRecordAction(input: unknown): Promise<ActionResponse> {
  const parsed = createCustomerSchema.safeParse(input);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    const payload = {
      ...parsed.data,
      lastServiceDate: parsed.data.lastServiceDate ? new Date(parsed.data.lastServiceDate) : undefined
    };
    await customerService.createCustomer(ownerId, payload);
    await revalidate("/dashboard/business-owner/customers");
    return { success: true, message: "Customer added" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateCustomerRecordAction(input: unknown): Promise<ActionResponse> {
  const parsed = updateCustomerSchema.safeParse(input);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    const { customerId, ...updates } = parsed.data;
    const payload = {
      ...updates,
      lastServiceDate: updates.lastServiceDate ? new Date(updates.lastServiceDate) : undefined
    };
    await customerService.updateCustomer(ownerId, customerId, payload);
    await revalidate("/dashboard/business-owner/customers");
    return { success: true, message: "Customer updated" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function recordCustomerInteractionAction(input: unknown): Promise<ActionResponse> {
  const parsed = recordInteractionSchema.safeParse(input);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId, session } = await requireBusinessOwner();
    await customerService.recordInteraction(ownerId, parsed.data.customerId, {
      note: parsed.data.note,
      jobId: parsed.data.jobId,
      amount: parsed.data.amount,
      followUpDate: parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : undefined,
      createdBy: session.user.name || session.user.email || "Business Owner"
    });
    await revalidate("/dashboard/business-owner/customers");
    return { success: true, message: "Interaction logged" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteCustomerRecordAction(input: unknown): Promise<ActionResponse> {
  const parsed = identifierSchema.safeParse({ id: input });
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const { ownerId } = await requireBusinessOwner();
    await customerService.deleteCustomer(ownerId, parsed.data.id);
    await revalidate("/dashboard/business-owner/customers");
    return { success: true, message: "Customer removed" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
