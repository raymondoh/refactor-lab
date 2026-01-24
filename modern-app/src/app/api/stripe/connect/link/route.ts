// src/app/api/stripe/connect/link/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { stripe } from "@/lib/stripe/server";
import { getApiBaseUrl } from "@/lib/url";
import { logger } from "@/lib/logger";

type MaybeNextRequest = Request & {
  nextUrl?: {
    origin: string;
  };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isOnboardingCompleteLocal(user: { stripeOnboardingComplete?: boolean; stripeChargesEnabled?: boolean }) {
  // Local quick check; we’ll still confirm with Stripe if uncertain
  return Boolean(user.stripeOnboardingComplete || user.stripeChargesEnabled);
}

function isNoSuchAccountError(err: unknown): boolean {
  const e = err as { statusCode?: number; code?: string; message?: string };
  if (!e) return false;

  // Common patterns for "account does not exist" across Stripe SDK versions
  if (e.statusCode === 404) return true;
  if (e.code === "resource_missing") return true;
  if (typeof e.message === "string" && e.message.includes("No such account")) return true;

  return false;
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const role = session.user.role;

    // Both tradespeople and business owners can manage payouts
    if (role !== "tradesperson" && role !== "business_owner") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const user = await userService.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 1) Ensure a Connect account exists (idempotent & robust between test/live)
    let accountId: string | null = user.stripeConnectAccountId || null;

    if (accountId) {
      // Validate that this account actually exists in the current Stripe environment
      try {
        await stripe.accounts.retrieve(accountId);
      } catch (err: unknown) {
        if (isNoSuchAccountError(err)) {
          logger.warn(
            "[stripe/connect/link] Stored stripeConnectAccountId is invalid in this environment. " +
              "Clearing and creating a new Express account.",
            { userId: user.id, accountId }
          );

          accountId = null;

          await userService.updateUser(user.id, {
            stripeConnectAccountId: null,
            stripeOnboardingComplete: false,
            stripeChargesEnabled: false
          });
        } else {
          logger.error("[stripe/connect/link] Unexpected error while retrieving account", err);
          return NextResponse.json({ message: "Failed to verify Stripe Connect account" }, { status: 500 });
        }
      }
    }

    if (!accountId) {
      const account = await stripe.accounts.create(
        {
          type: "express",
          email: user.email ?? undefined,
          capabilities: { transfers: { requested: true } },
          metadata: { userId: user.id }
        },
        { idempotencyKey: `connect:acct:create:${user.id}` }
      );

      accountId = account.id;
      await userService.updateUser(user.id, {
        stripeConnectAccountId: accountId,
        stripeOnboardingComplete: false,
        stripeChargesEnabled: false
      });
    }

    // 2) Build return/refresh destinations
    const origin = (req as MaybeNextRequest).nextUrl?.origin ?? getApiBaseUrl(req);
    const dashboardPath = role === "business_owner" ? "/dashboard/business-owner" : "/dashboard/tradesperson";

    const refresh_url = new URL(`${dashboardPath}?connect=retry`, origin).toString();

    // Same-origin hardening for return_url
    const desiredReturn = new URL(`${dashboardPath}?connect=done`, origin);
    if (desiredReturn.origin !== origin) {
      desiredReturn.href = new URL(dashboardPath, origin).toString();
      desiredReturn.searchParams.set("connect", "done");
    }
    const return_url = desiredReturn.toString();

    // 3) Decide if onboarding is complete
    let complete = isOnboardingCompleteLocal(user);

    // If our local flags aren’t definitively true, confirm with Stripe live state
    if (!complete) {
      const acct = await stripe.accounts.retrieve(accountId);
      complete = Boolean(acct.details_submitted || acct.charges_enabled || acct.payouts_enabled);

      // Persist completion to avoid future fetches
      if (complete && !user.stripeOnboardingComplete) {
        await userService.updateUser(user.id, {
          stripeOnboardingComplete: true,
          stripeChargesEnabled: Boolean(acct.charges_enabled)
        });
      }
    }

    // 4) Return the correct URL
    if (complete) {
      // Already onboarded → send them to the Stripe Express dashboard
      const login = await stripe.accounts.createLoginLink(accountId);
      const loginUrl = new URL(login.url);
      // Controls where they end up when they click “Return to your site”
      loginUrl.searchParams.set("redirect_url", return_url);

      const res = NextResponse.json({ url: loginUrl.toString() });
      res.headers.set("Cache-Control", "no-store");
      return res;
    } else {
      // Not complete → continue onboarding
      const link = await stripe.accountLinks.create({
        account: accountId,
        type: "account_onboarding",
        refresh_url,
        return_url
      });

      const res = NextResponse.json({ url: link.url });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  } catch (err: unknown) {
    logger.error("[stripe/connect/link] error", err);
    return NextResponse.json({ message: "Failed to create Connect link" }, { status: 500 });
  }
}
