// src/app/api/register/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { userService } from "@/lib/services/user-service";
import { tokenService } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/email-service";
import { REGISTERABLE_ROLES, DEFAULT_ROLE } from "@/lib/auth/roles";
import { logger } from "@/lib/logger";
import { registerRateLimiter, registerIpBackstopRateLimiter, rateLimitKeys } from "@/lib/rate-limiter";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(REGISTERABLE_ROLES).default(DEFAULT_ROLE as (typeof REGISTERABLE_ROLES)[number])
});

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

function getClientIp(request: NextRequest) {
  const xff = request.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : "127.0.0.1";
}

export async function POST(request: NextRequest) {
  // ✅ 0) Maintenance mode guard
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
    return NextResponse.json({ error: "Maintenance in progress" }, { status: 503, headers: NO_STORE_HEADERS });
  }

  const ip = getClientIp(request);

  try {
    // ✅ 1) Parse body first so we can rate-limit by (IP + email)
    const rawBody = (await request.json()) as unknown;

    const parsed = registerSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues?.[0]?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const { password, name, role } = parsed.data;

    // ✅ 2) Rate limit: prefer (IP + email), plus IP-only backstop
    try {
      const ipEmailKey = rateLimitKeys.ipEmail(ip, email);
      const { success: ipEmailOk } = await registerRateLimiter.limit(ipEmailKey);

      if (!ipEmailOk) {
        logger.warn("[api/register] Rate limit exceeded (ip+email)", { ip, email });
        return NextResponse.json(
          { error: "Too many registration attempts. Please try again later." },
          { status: 429, headers: NO_STORE_HEADERS }
        );
      }

      const ipOnlyKey = rateLimitKeys.ipOnly(ip);
      const { success: ipOnlyOk } = await registerIpBackstopRateLimiter.limit(ipOnlyKey);

      if (!ipOnlyOk) {
        logger.warn("[api/register] Rate limit exceeded (ip backstop)", { ip });
        return NextResponse.json(
          { error: "Too many registration attempts. Please try again later." },
          { status: 429, headers: NO_STORE_HEADERS }
        );
      }
    } catch (rateError: unknown) {
      // fail-closed for auth endpoints
      logger.error("[api/register] Rate limiter unexpected error (failing closed)", rateError);
      return NextResponse.json(
        { error: "Registration is temporarily unavailable. Please try again shortly." },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    // ✅ 3) Create user (throws if already exists)
    const user = await userService.createUser(email, password, name, role);

    // ✅ 4) Create and send email verification token
    const token = await tokenService.createEmailVerificationToken(email);
    await emailService.sendVerificationEmail(email, token, name);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        message: "Registration successful! Please check your email to verify your account."
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    logger.error("❌ [api/register] Registration error:", err);

    if (err instanceof z.ZodError) {
      const issue = err.issues?.[0];
      return NextResponse.json(
        { error: issue?.message ?? "Invalid request data" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const errorMessage = err instanceof Error ? err.message : "Registration failed";

    if (errorMessage.includes("User already exists")) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
