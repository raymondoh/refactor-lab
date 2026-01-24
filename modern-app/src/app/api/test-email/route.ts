// src/app/api/test-email/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { Resend } from "resend";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";
import { isAdmin } from "@/lib/auth/roles";
import { logger } from "@/lib/logger";

const env = getEnv();

const testEmailSchema = z.object({
  email: z.string().email("Invalid email address")
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication: Ensure the user is logged in.
    const session = await requireSession();

    // 2. Authorization: Ensure the user is an admin.
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    logger.info("🧪 Test Email: Starting email test");
    logger.info(`🧪 RESEND_API_KEY present: ${!!env.RESEND_API_KEY}`);
    logger.info(`🧪 EMAIL_FROM: ${env.EMAIL_FROM}`);

    if (!env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 400 });
    }

    const resend = new Resend(env.RESEND_API_KEY);

    const body = await request.json();
    const { email } = testEmailSchema.parse(body);

    logger.info(`🧪 Test Email: Sending test email to ${email}`);

    const result = await resend.emails.send({
      from: env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "Test Email from Plumbers Portal",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify your Resend configuration is working.</p>
        <p>If you received this, your email service is configured correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });

    logger.info("🧪 Test Email: Result:", result);

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      result
    });
  } catch (err: unknown) {
    logger.error("🧪 Test Email: Error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid email" }, { status: 400 });
    }

    const message = err instanceof Error ? err.message : "Failed to send test email";
    const details = err instanceof Error ? err.toString() : String(err);

    return NextResponse.json(
      {
        error: message,
        details
      },
      { status: 500 }
    );
  }
}
