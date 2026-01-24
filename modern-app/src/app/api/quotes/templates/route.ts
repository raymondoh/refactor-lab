// src/app/api/quotes/templates/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { countPersonalTemplates, createTemplate, getTemplatesForUser } from "@/lib/services/quote-template-service";
import type { QuoteTemplateCategory, QuoteUnit } from "@/lib/types/quote";
import { logger } from "@/lib/logger";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;
const BASIC_TEMPLATE_LIMIT = 5;

const templateInputSchema = z.object({
  label: z.string().min(1),
  category: z.custom<QuoteTemplateCategory>(val =>
    ["labour", "materials", "callout", "warranty", "other"].includes(val as string)
  ),
  description: z.string().min(1),
  unit: z.custom<QuoteUnit>(val => ["hour", "day", "item", "job"].includes(val as string)),
  defaultQuantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  vatRate: z.number().nonnegative().optional(),
  warrantyText: z.string().optional(),
  scope: z.enum(["personal", "business"]).optional()
});

export async function GET() {
  try {
    const session = await requireSession();
    const user = await userService.getUserById(session.user.id);
    // FIX: Normalize tier to ensure it matches 'basic' | 'pro' | 'business'
    // This handles cases where subscriptionTier might be 'free' or undefined
    const rawTier = user?.subscriptionTier;
    const tier: "basic" | "pro" | "business" = rawTier === "business" || rawTier === "pro" ? rawTier : "basic";

    const templates = await getTemplatesForUser({
      userId: session.user.id,
      tier,
      businessId: user?.businessId
    });

    return NextResponse.json({ templates }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.error("Failed to fetch templates", error);
    return NextResponse.json({ message: "Failed to fetch templates" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const user = await userService.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const body = await request.json();
    const parsed = templateInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: parsed.error.flatten() },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // FIX: Normalize tier here as well
    const rawTier = user.subscriptionTier;
    const tier: "basic" | "pro" | "business" = rawTier === "business" || rawTier === "pro" ? rawTier : "basic";
    const scopeHint = parsed.data.scope ?? "personal";
    const canUseBusinessScope =
      tier === "business" && user.businessId && (user.role === "business_owner" || user.role === "manager");

    if (scopeHint === "business" && !canUseBusinessScope) {
      return NextResponse.json(
        { message: "You do not have permission to create business templates." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    if (tier === "basic") {
      const currentCount = await countPersonalTemplates(user.id);
      if (currentCount >= BASIC_TEMPLATE_LIMIT) {
        return NextResponse.json(
          {
            code: "template_limit",
            message:
              "You have reached the Basic plan limit of 5 saved templates. Upgrade to Pro for unlimited templates.",
            limit: BASIC_TEMPLATE_LIMIT,
            used: currentCount
          },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }
    }

    const template = await createTemplate({
      userId: user.id,
      tier,
      businessId: user.businessId,
      role: user.role,
      payload: parsed.data
    });

    return NextResponse.json({ template }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.error("Failed to create template", error);
    return NextResponse.json({ message: "Failed to create template" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
