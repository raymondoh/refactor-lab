// src/app/api/quotes/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startOfMonth } from "date-fns";
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import type { Tier } from "@/lib/subscription/tier";
import { standardRateLimiter } from "@/lib/rate-limiter";
import { verifyRecaptcha } from "@/lib/recaptcha-service";
import { logger } from "@/lib/logger";
import type { QuoteLineItem } from "@/lib/types/quote";

const RECAPTCHA_MIN_SCORE = 0.4;

const BASIC_MONTHLY_QUOTE_LIMIT = 5;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;
const RECAPTCHA_ACTION = "submit_quote";

const lineItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().nullable().optional(),
  description: z.string().min(1),
  category: z.enum(["labour", "materials", "callout", "warranty", "other"]).optional(),
  unit: z.enum(["hour", "day", "item", "job"]),
  quantity: z.coerce.number().positive(), // handles "1" or 1
  unitPrice: z.coerce.number().nonnegative(), // handles "200" or 200
  vatRate: z.coerce.number().nonnegative().optional(),
  warrantyText: z.string().optional()
});

const quoteSchema = z.object({
  jobId: z.string().min(1),
  price: z.coerce.number().positive(),
  // Allow undefined, null, "" or 0 to *all* mean "no deposit"
  depositAmount: z
    .preprocess(val => {
      if (val === "" || val === null || typeof val === "undefined") return undefined;
      const num = typeof val === "number" ? val : Number(val);
      if (!Number.isFinite(num) || num <= 0) return undefined;
      return num;
    }, z.number().positive())
    .optional(),
  description: z.string().min(10),
  estimatedDuration: z.string().min(1),
  availableDate: z.coerce.date(),
  lineItems: z.array(lineItemSchema).optional()
});

// Coerce Firestore Timestamp | string | number | Date -> Date
type FirestoreTimestamp = { toDate: () => Date } | { seconds: number };
function toDate(value: Date | FirestoreTimestamp | number | string | null | undefined): Date {
  if (value instanceof Date) return value;
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function")
    return (value as { toDate: () => Date }).toDate();
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  if (value && typeof (value as { seconds?: number }).seconds === "number")
    return new Date((value as { seconds: number }).seconds * 1000);
  return new Date();
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await standardRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429, headers: NO_STORE_HEADERS });
  }

  try {
    const session = await requireSession();
    const { id: userId, role, subscriptionTier } = session.user;
    const tier = (subscriptionTier ?? "basic") as Tier;

    // ✅ Allow:
    // - tradesperson (any tier)
    // - business_owner with Business tier
    const canSubmitQuote = role === "tradesperson" || (role === "business_owner" && tier === "business");

    if (!canSubmitQuote) {
      return NextResponse.json(
        {
          message: "Only tradespeople and Business-tier business owners can submit quotes."
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const json = (await request.json()) as Record<string, unknown>;
    const recaptchaToken = typeof json.recaptchaToken === "string" ? json.recaptchaToken : null;

    const recaptchaResult = await verifyRecaptcha(recaptchaToken, RECAPTCHA_ACTION);

    if (!recaptchaResult.ok || (recaptchaResult.score ?? 0) < RECAPTCHA_MIN_SCORE) {
      logger.warn("[quotes] reCAPTCHA failed on submit_quote", {
        ip,
        userId,
        reason: recaptchaResult.reason,
        score: recaptchaResult.raw?.score
      });

      return NextResponse.json(
        { message: "reCAPTCHA verification failed. Please try again." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    logger.info("[quotes] reCAPTCHA passed for submit_quote", {
      ip,
      userId,
      score: recaptchaResult.raw?.score
    });

    const { recaptchaToken: _recaptchaToken, ...payload } = json;
    void _recaptchaToken;

    const parsed = quoteSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn("[quotes] invalid request data", {
        userId,
        errors: parsed.error.issues,
        payload
      });

      return NextResponse.json(
        { message: "Invalid request data", errors: parsed.error.issues },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const {
      jobId,
      price,
      depositAmount,
      description,
      estimatedDuration,
      availableDate,
      lineItems: parsedLineItems
    } = parsed.data;

    // ✅ Explicitly type this so TS is happy
    const lineItems = parsedLineItems as QuoteLineItem[] | undefined;

    // Validate job
    const job = await jobService.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    if (job.status !== "open") {
      return NextResponse.json({ message: "Job is not open for quotes" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    // ----- Plan limits (server-authoritative) -----
    if (tier === "basic") {
      const quotes = await jobService.getQuotesByTradespersonId(userId);
      const monthStart = startOfMonth(new Date());
      const usedThisMonth = quotes.filter(q => toDate(q.createdAt) >= monthStart).length;

      if (usedThisMonth >= BASIC_MONTHLY_QUOTE_LIMIT) {
        return NextResponse.json(
          {
            code: "quote_limit",
            message: `You've reached your monthly quote limit on the Basic plan (${BASIC_MONTHLY_QUOTE_LIMIT}/month).`,
            used: usedThisMonth,
            limit: BASIC_MONTHLY_QUOTE_LIMIT,
            tier
          },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }
    }
    // Pro/Business: unlimited

    // Create quote
    const quote = await jobService.createQuote(userId, {
      jobId,
      price,
      depositAmount,
      description,
      estimatedDuration,
      availableDate,
      lineItems
    });

    return NextResponse.json(
      { message: "Quote submitted successfully", quoteId: quote.id },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    logger.error("Error submitting quote:", err);

    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("quote limit")) {
      // In case the service also enforces and throws
      return NextResponse.json({ code: "quote_limit", message: msg }, { status: 403, headers: NO_STORE_HEADERS });
    }

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: err.issues[0]?.message ?? "Invalid request" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ message: "Failed to submit quote" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
