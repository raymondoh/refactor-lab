// src/app/api/jobs/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jobService } from "@/lib/services/job-service";
import { requireSession } from "@/lib/auth/require-session";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";
import { normalizeSpecialties, toSlug } from "@/lib/jobs/normalize-specialties";
import { verifyRecaptcha } from "@/lib/recaptcha-service";
import { logger } from "@/lib/logger";
import { jobCoreSchema } from "@/lib/schemas/job-form-schema";
import type { JobServiceType } from "@/lib/config/locations";
import { JOB_SERVICE_TYPES } from "@/lib/config/locations";

const RECAPTCHA_ACTION = "create_job";
const RECAPTCHA_MIN_SCORE = 0.5;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

// ---------- Helpers for coercion ----------

// Coerce budget coming from a form:
// - number → number
// - numeric string → number
// - "" / null / undefined → undefined
const budgetSchema = z.union([z.coerce.number().nonnegative(), z.literal("").transform(() => undefined)]).optional();

// Coerce scheduledDate:
// - valid ISO / date string → Date
// - Date → Date
// - "" / null / undefined → undefined
const scheduledDateSchema = z
  .union([
    z
      .string()
      .min(1)
      .transform(val => new Date(val)),
    z.date()
  ])
  .optional()
  .refine(value => !value || !Number.isNaN(value.getTime()), { message: "Invalid scheduled date" });

// Zod schema for job creation
const createJobSchema = jobCoreSchema.extend({
  location: z.object({
    postcode: z.string().trim().min(1, "A valid postcode is required"),
    address: z.string().trim().optional(),
    town: z.string().trim().optional()
  }),
  customerContact: z.object({
    name: z.string().trim().min(1),
    email: z.string().email(),
    phone: z.string().trim().min(1)
  }),
  budget: budgetSchema,
  // ✅ Now using the same union as the form (single source of truth)
  serviceType: z.enum(JOB_SERVICE_TYPES),
  specialties: z.array(z.string().min(1)).optional(),
  scheduledDate: scheduledDateSchema
});

export async function GET(_request: NextRequest) {
  try {
    const session = await requireSession();

    if (!canAccess(session.user.role, SERVICE_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Let the service handle Firestore → JSON-safe conversion
    const jobs = await jobService.getOpenJobs();

    return NextResponse.json({ jobs }, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    logger.error("[jobs/list] Error fetching jobs", err);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    if (!["customer", "admin"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const json = (await request.json()) as Record<string, unknown>;
    const recaptchaToken = typeof json.recaptchaToken === "string" ? json.recaptchaToken : null;

    // reCAPTCHA v3 verification
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, RECAPTCHA_ACTION);

    if (!recaptchaResult.ok || (recaptchaResult.score ?? 0) < RECAPTCHA_MIN_SCORE) {
      logger.warn("[jobs/create] reCAPTCHA failed", {
        userId: session.user.id,
        reason: recaptchaResult.reason,
        score: recaptchaResult.raw?.score
      });

      return NextResponse.json(
        { error: "reCAPTCHA verification failed. Please try again." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Strip token before validation
    const { recaptchaToken: _recaptchaToken, ...payload } = json;
    void _recaptchaToken;
    logger.info("[jobs/create] Incoming payload", payload);

    const parsed = createJobSchema.safeParse(payload);

    if (!parsed.success) {
      const flat = parsed.error.flatten();

      logger.error("[jobs/create] VALIDATION FAILED", {
        userId: session.user.id,
        rawPayload: json,
        fieldErrors: flat.fieldErrors
      });

      return NextResponse.json(
        {
          error: "Validation failed",
          fieldErrors: flat.fieldErrors
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const data = parsed.data;

    // ✅ Normalize specialties from payload + serviceType
    const normalizedSpecialties = normalizeSpecialties(data.serviceType as JobServiceType, data.specialties);

    // ✅ City slug from town if provided
    const town = data.location?.town;
    const citySlug = town ? toSlug(town) : undefined;

    const job = await jobService.createJob({
      title: data.title,
      description: data.description,
      urgency: data.urgency,
      location: data.location,
      budget: data.budget,
      serviceType: data.serviceType,
      specialties: normalizedSpecialties,
      citySlug,
      photos: data.photos,
      scheduledDate: data.scheduledDate,
      customerId: session.user.id,
      customerContact: {
        name: data.customerContact.name,
        email: session.user.email ?? data.customerContact.email,
        phone: data.customerContact.phone
      }
    });

    return NextResponse.json(job, {
      status: 201,
      headers: NO_STORE_HEADERS
    });
  } catch (err: unknown) {
    logger.error("[jobs/create] Error creating job", err);
    const message = err instanceof Error ? err.message : "Failed to create job";

    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
