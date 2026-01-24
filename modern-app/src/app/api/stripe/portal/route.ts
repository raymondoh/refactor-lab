// src/app/api/stripe/portal/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { UsersCollection } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/server";
import { getApiBaseUrl } from "@/lib/url";
import { logger } from "@/lib/logger";

type MaybeNextRequest = Request & {
  nextUrl?: { origin: string };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const uid = session.user.id!;
    const role = session.user.role;

    // Only tradespeople and business owners manage subscriptions
    if (role !== "tradesperson" && role !== "business_owner") {
      return NextResponse.json(
        { error: "Forbidden: Only tradespeople or business owners can manage subscriptions." },
        { status: 403 }
      );
    }

    // Get Firestore user record
    const snap = await UsersCollection().doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { stripeCustomerId } = snap.data() as { stripeCustomerId?: string };

    if (!stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer on file" }, { status: 400 });
    }

    // Build return URL
    const origin = (req as MaybeNextRequest).nextUrl?.origin ?? getApiBaseUrl(req);
    const dashboardPath = role === "business_owner" ? "/dashboard/business-owner" : "/dashboard/tradesperson";

    const return_url = new URL(dashboardPath, origin).toString();

    const portalConfig = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID;

    // Create the Stripe billing portal session
    const sessionPortal = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url,
      ...(portalConfig ? { configuration: portalConfig } : {})
    });

    // Response
    const res = NextResponse.json({ url: sessionPortal.url });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err: unknown) {
    // Unified error logging & consistent API output
    return logger.apiError("stripe/portal", err);
  }
}
