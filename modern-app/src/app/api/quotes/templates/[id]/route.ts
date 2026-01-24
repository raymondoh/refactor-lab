// src/app/api/quotes/templates/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { deleteTemplate, getTemplateById, updateTemplate } from "@/lib/services/quote-template-service";
import type { QuoteTemplateCategory, QuoteUnit } from "@/lib/types/quote";
import { logger } from "@/lib/logger";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  category: z
    .custom<QuoteTemplateCategory>(val =>
      ["labour", "materials", "callout", "warranty", "other"].includes(val as string)
    )
    .optional(),
  description: z.string().min(1).optional(),
  unit: z.custom<QuoteUnit>(val => ["hour", "day", "item", "job"].includes(val as string)).optional(),
  defaultQuantity: z.number().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  vatRate: z.number().nonnegative().optional(),
  warrantyText: z.string().optional(),
  isArchived: z.boolean().optional()
});

async function assertCanEdit(templateId: string, userId: string, role?: string, businessId?: string | null) {
  const template = await getTemplateById(templateId);
  if (!template) return { ok: false as const, status: 404, message: "Template not found" };

  if (template.scope === "personal" && template.ownerUserId === userId) {
    return { ok: true as const, template };
  }

  if (template.scope === "business" && template.businessId && template.businessId === businessId) {
    const canEdit = role === "business_owner" || role === "manager";
    if (canEdit) return { ok: true as const, template };
  }

  return { ok: false as const, status: 403, message: "You do not have permission to modify this template." };
}

// ✅ Updated to match Next 16's validator: context.params is a Promise
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const session = await requireSession();
    const userId = "uid" in session.user ? (session.user as { uid: string }).uid : session.user.id;
    const user = await userService.getUserById(userId);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsed.error.flatten() },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const permission = await assertCanEdit(id, userId, user?.role ?? undefined, user?.businessId ?? null);
    if (!permission.ok) {
      return NextResponse.json(
        { message: permission.message },
        { status: permission.status, headers: NO_STORE_HEADERS }
      );
    }

    await updateTemplate(id, parsed.data);

    return NextResponse.json({ message: "Template updated" }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.error("Failed to update template", error);
    return NextResponse.json({ message: "Failed to update template" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

// ✅ Also updated DELETE signature to the same pattern
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const session = await requireSession();
    const userId = "uid" in session.user ? (session.user as { uid: string }).uid : session.user.id;
    const user = await userService.getUserById(userId);

    const permission = await assertCanEdit(id, userId, user?.role ?? undefined, user?.businessId ?? null);

    if (!permission.ok) {
      return NextResponse.json(
        { message: permission.message },
        { status: permission.status, headers: NO_STORE_HEADERS }
      );
    }

    await deleteTemplate(id);

    return NextResponse.json({ message: "Template archived" }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.error("Failed to delete template", error);
    return NextResponse.json({ message: "Failed to delete template" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
