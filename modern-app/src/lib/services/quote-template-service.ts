// src/lib/services/quote-template-service.ts
import { QuoteTemplatesCollection } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";
import type { QuoteTemplate, QuoteTemplateCategory, QuoteTemplateScope, QuoteUnit } from "@/lib/types/quote";
import type { UserRole } from "@/lib/types/user";

const SYSTEM_TEMPLATES: QuoteTemplate[] = [
  {
    id: "system-labour-hour",
    scope: "system",
    label: "Labour (hourly)",
    category: "labour",
    description: "Standard labour charge per hour",
    unit: "hour",
    defaultQuantity: 1,
    unitPrice: 80,
    vatRate: 20,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString()
  },
  {
    id: "system-callout",
    scope: "system",
    label: "Call-out fee",
    category: "callout",
    description: "Emergency call-out fee",
    unit: "job",
    defaultQuantity: 1,
    unitPrice: 60,
    vatRate: 20,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString()
  },
  {
    id: "system-warranty",
    scope: "system",
    label: "12-month workmanship warranty",
    category: "warranty",
    description: "Coverage for workmanship defects",
    unit: "job",
    defaultQuantity: 1,
    unitPrice: 0,
    warrantyText: "12-month warranty on workmanship for this job.",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString()
  }
];

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function normalizeCategory(value: unknown): QuoteTemplateCategory {
  const allowed: QuoteTemplateCategory[] = ["labour", "materials", "callout", "warranty", "other"];
  return allowed.includes(value as QuoteTemplateCategory) ? (value as QuoteTemplateCategory) : "other";
}

function normalizeUnit(value: unknown): QuoteUnit {
  const allowed: QuoteUnit[] = ["hour", "day", "item", "job"];
  return allowed.includes(value as QuoteUnit) ? (value as QuoteUnit) : "item";
}

function toTemplate(id: string, data: Record<string, unknown>): QuoteTemplate {
  const createdAt = (data.createdAt as Date | undefined)?.toISOString?.() ?? new Date().toISOString();
  const updatedAt = (data.updatedAt as Date | undefined)?.toISOString?.() ?? createdAt;

  return {
    id,
    scope: (data.scope as QuoteTemplateScope) ?? "personal",
    ownerUserId: typeof data.ownerUserId === "string" ? data.ownerUserId : undefined,
    businessId: typeof data.businessId === "string" ? data.businessId : undefined,
    label: typeof data.label === "string" ? data.label : "Template",
    category: normalizeCategory(data.category),
    description: typeof data.description === "string" ? data.description : "",
    unit: normalizeUnit(data.unit),
    defaultQuantity: parseNumber(data.defaultQuantity) ?? 1,
    unitPrice: parseNumber(data.unitPrice) ?? 0,
    vatRate: parseNumber(data.vatRate),
    warrantyText: typeof data.warrantyText === "string" ? data.warrantyText : undefined,
    isArchived: Boolean(data.isArchived),
    subscriptionTierAtCreation:
      data.subscriptionTierAtCreation === "pro" || data.subscriptionTierAtCreation === "business"
        ? data.subscriptionTierAtCreation
        : "basic",
    createdAt,
    updatedAt
  };
}

export async function getTemplatesForUser(params: {
  userId: string;
  tier: "basic" | "pro" | "business";
  businessId?: string | null;
}): Promise<QuoteTemplate[]> {
  const { userId, tier, businessId } = params;
  const collection = QuoteTemplatesCollection();

  const system = SYSTEM_TEMPLATES;
  const personalSnapshot = await collection.where("scope", "==", "personal").where("ownerUserId", "==", userId).get();
  const personal = personalSnapshot.docs.map(doc => toTemplate(doc.id, doc.data() as Record<string, unknown>));

  let business: QuoteTemplate[] = [];
  if (tier === "business" && businessId) {
    const businessSnapshot = await collection
      .where("scope", "==", "business")
      .where("businessId", "==", businessId)
      .get();
    business = businessSnapshot.docs.map(doc => toTemplate(doc.id, doc.data() as Record<string, unknown>));
  }

  return [...system, ...personal, ...business].filter(t => !t.isArchived);
}

export async function getTemplateById(templateId: string): Promise<QuoteTemplate | null> {
  const snapshot = await QuoteTemplatesCollection().doc(templateId).get();
  if (!snapshot.exists) return null;
  return toTemplate(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export async function countPersonalTemplates(userId: string): Promise<number> {
  const snapshot = await QuoteTemplatesCollection()
    .where("scope", "==", "personal")
    .where("ownerUserId", "==", userId)
    .where("isArchived", "!=", true)
    .get();
  return snapshot.size;
}

export async function createTemplate(params: {
  userId: string;
  tier: "basic" | "pro" | "business";
  businessId?: string | null;
  role?: UserRole | null;
  payload: Omit<QuoteTemplate, "id" | "createdAt" | "updatedAt" | "scope" | "subscriptionTierAtCreation"> & {
    scope?: QuoteTemplateScope;
  };
}): Promise<QuoteTemplate> {
  const { userId, tier, businessId, role, payload } = params;
  const collection = QuoteTemplatesCollection();
  const now = new Date();

  const requestedScope = payload.scope ?? "personal";
  const canUseBusinessScope = tier === "business" && businessId && (role === "business_owner" || role === "manager");
  const scope: QuoteTemplateScope = requestedScope === "business" && canUseBusinessScope ? "business" : "personal";

  const doc = collection.doc();

  const record: Record<string, unknown> = {
    scope,
    ownerUserId: scope === "personal" ? userId : undefined,
    businessId: scope === "business" ? businessId : undefined,
    label: payload.label,
    category: payload.category,
    description: payload.description,
    unit: payload.unit,
    defaultQuantity: payload.defaultQuantity,
    unitPrice: payload.unitPrice,
    vatRate: payload.vatRate,
    warrantyText: payload.warrantyText,
    isArchived: false,
    subscriptionTierAtCreation: tier,
    createdAt: now,
    updatedAt: now
  };

  await doc.set(record);

  return toTemplate(doc.id, record);
}

export async function updateTemplate(
  templateId: string,
  updates: Partial<{
    label: string;
    category: QuoteTemplateCategory;
    description: string;
    unit: QuoteUnit;
    defaultQuantity: number;
    unitPrice: number;
    vatRate?: number;
    warrantyText?: string;
    isArchived?: boolean;
  }>
): Promise<void> {
  try {
    await QuoteTemplatesCollection()
      .doc(templateId)
      .update({
        ...updates,
        updatedAt: new Date()
      });
  } catch (error) {
    logger.error("Failed to update template", { templateId, error });
    throw error;
  }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    await QuoteTemplatesCollection().doc(templateId).update({ isArchived: true, updatedAt: new Date() });
  } catch (error) {
    logger.error("Failed to delete template", { templateId, error });
    throw error;
  }
}
