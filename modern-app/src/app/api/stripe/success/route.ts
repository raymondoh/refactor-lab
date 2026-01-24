// src/app/api/stripe/success/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";
import { asTier, deriveRoleFromTier } from "@/lib/subscription/tier";
import { userService } from "@/lib/services/user-service";
import { revalidatePath } from "next/cache";
import type { SubscriptionStatus } from "@/lib/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Narrow any user role to the dashboard roles we route to
const asDashboardRole = (role?: string): "tradesperson" | "business_owner" | undefined => {
  return role === "tradesperson" || role === "business_owner" ? role : undefined;
};

function buildSubscriptionRedirect(
  req: NextRequest,
  role?: "tradesperson" | "business_owner",
  plan?: "pro" | "business" | null
) {
  const dashboardPath = role === "business_owner" ? "/dashboard/business-owner" : "/dashboard/tradesperson";
  const redirectUrl = new URL(dashboardPath, req.url);
  redirectUrl.searchParams.set("payment_success", "true");
  if (plan) {
    redirectUrl.searchParams.set("plan", plan);
  }
  return NextResponse.redirect(redirectUrl);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    const session = await requireSession().catch((_err: unknown) => null);
    return buildSubscriptionRedirect(req, asDashboardRole(session?.user.role));
  }

  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);

    // Only proceed for completed & paid sessions (subscription or one-off)
    const isComplete = checkout.status === "complete";
    const isPaid = checkout.payment_status === "paid";
    const metadata = checkout.metadata ?? {};

    // Job flow redirect (only if completed)
    if (isComplete && metadata.jobId) {
      const jobUrl = new URL(`/dashboard/customer/jobs/${metadata.jobId}`, req.url);
      if (metadata.paymentType === "final") {
        jobUrl.searchParams.set("final_payment_made", "true");
      } else {
        jobUrl.searchParams.set("deposit_paid", "true");
      }
      return NextResponse.redirect(jobUrl);
    }

    // Subscription flow
    const session = await requireSession(); // must be logged in to persist
    const userRoleDash = asDashboardRole(session.user.role);
    const tier = asTier(metadata.tier);
    const isUpgrade = isPaid && tier !== "basic";

    // Build redirect now (role-aware)
    const redirect = buildSubscriptionRedirect(req, userRoleDash, isUpgrade ? tier : null);

    logger.info("[stripe/success] Session retrieved", {
      sessionId,
      checkoutStatus: checkout.status,
      paymentStatus: checkout.payment_status,
      mode: checkout.mode,
      tier
    });

    // Only persist + update if this success belongs to the current user
    const metadataUserId = metadata.userId;

    if (isUpgrade && metadataUserId && session.user.id === metadataUserId) {
      // --- NEW: persist subscription upgrade immediately (in addition to webhook) ---
      const stripeCustomerId = checkout.customer as string | null;

      if (stripeCustomerId) {
        try {
          await userService.updateUser(metadataUserId, {
            stripeCustomerId,
            subscriptionTier: tier,
            subscriptionStatus: "active" as SubscriptionStatus,
            role: deriveRoleFromTier(tier, session.user.role)
          });

          // Revalidate the relevant dashboard path so UI shows the new tier promptly
          if (userRoleDash === "business_owner") {
            revalidatePath("/dashboard/business-owner");
          } else if (userRoleDash === "tradesperson") {
            revalidatePath("/dashboard/tradesperson");
          }
          // If your root /dashboard view shows tier, you can also:
          // revalidatePath("/dashboard");

          logger.info("[stripe/success] User updated from success route", {
            userId: metadataUserId,
            stripeCustomerId,
            subscriptionTier: tier
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Unknown user update error";
          logger.error("[stripe/success] Failed to update user on success route", {
            message,
            error,
            userId: metadataUserId,
            stripeCustomerId,
            subscriptionTier: tier
          });
          // Do not block redirect on failure
        }
      }

      // Existing: UI flash cookie for upgrade banner
      try {
        redirect.cookies.set("upgrade_flash", encodeURIComponent(JSON.stringify({ tier })), {
          path: "/",
          maxAge: 60,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: false
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown upgrade persistence error";
        logger.error("[stripe/success] Failed to set upgrade cookie", {
          message,
          error
        });
      }
    }

    return redirect;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown session retrieval error";
    logger.error("[stripe/success] Failed to retrieve session", {
      message,
      error: err
    });

    const session = await requireSession().catch((_e: unknown) => null);
    return buildSubscriptionRedirect(req, asDashboardRole(session?.user.role));
  }
}
