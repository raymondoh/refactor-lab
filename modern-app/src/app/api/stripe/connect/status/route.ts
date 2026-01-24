// // src/app/api/stripe/connect/status/route.ts
// import { NextResponse } from "next/server";
// import { requireSession } from "@/lib/auth/require-session";
// import { userService } from "@/lib/services/user-service";
// import { stripe } from "@/lib/stripe/server";
// import { logger } from "@/lib/logger";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// export async function GET() {
//   try {
//     const session = await requireSession();
//     const role = session.user.role;

//     if (role !== "tradesperson" && role !== "business_owner") {
//       return NextResponse.json({ message: "Forbidden" }, { status: 403 });
//     }

//     const user = await userService.getUserById(session.user.id);
//     if (!user) {
//       return NextResponse.json({ message: "User not found" }, { status: 404 });
//     }

//     if (!user.stripeConnectAccountId) {
//       const res = NextResponse.json({
//         stripeOnboardingComplete: false,
//         stripeChargesEnabled: false
//       });
//       res.headers.set("Cache-Control", "no-store");
//       return res;
//     }

//     const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
//     const stripeOnboardingComplete = Boolean(
//       user.stripeOnboardingComplete || account.details_submitted || account.payouts_enabled || account.charges_enabled
//     );
//     const stripeChargesEnabled = Boolean(account.charges_enabled);

//     if (
//       user.stripeOnboardingComplete !== stripeOnboardingComplete ||
//       user.stripeChargesEnabled !== stripeChargesEnabled
//     ) {
//       await userService.updateUser(user.id, { stripeOnboardingComplete, stripeChargesEnabled });
//     }

//     const res = NextResponse.json({ stripeOnboardingComplete, stripeChargesEnabled });
//     res.headers.set("Cache-Control", "no-store");
//     return res;
//   } catch (error) {
//     logger.error("[stripe/connect/status] Failed to refresh Stripe status", error);
//     return NextResponse.json({ message: "Unable to retrieve Stripe status" }, { status: 500 });
//   }
// }
// src/app/api/stripe/connect/status/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { stripe } from "@/lib/stripe/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function GET() {
  try {
    const session = await requireSession();
    const role = session.user.role;

    // Only tradespeople / business owners have payouts
    if (role !== "tradesperson" && role !== "business_owner") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const user = await userService.getUserById(session.user.id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    // In case the field name differs, adjust here:
    const stripeConnectAccountId =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (user as any).stripeConnectAccountId ??
      // fallback if you ever used another name:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (user as any).stripeAccountId ??
      null;

    if (!stripeConnectAccountId) {
      logger.warn("[stripe/connect/status] User has no Connect account ID", { userId: user.id });

      return NextResponse.json(
        {
          stripeOnboardingComplete: false,
          stripeChargesEnabled: false
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // Retrieve the latest account status from Stripe
    const account = await stripe.accounts.retrieve(stripeConnectAccountId);

    const payoutsEnabled = Boolean(account.payouts_enabled);
    const chargesEnabled = Boolean(account.charges_enabled);
    const detailsSubmitted = Boolean(account.details_submitted);

    // Our definition of "onboarding complete":
    // - either Stripe says details are submitted, OR
    // - payouts or charges are enabled.
    //
    // Once it's true in Firestore, we also treat it as sticky.
    const stripeOnboardingComplete = Boolean(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (user as any).stripeOnboardingComplete || detailsSubmitted || payoutsEnabled || chargesEnabled
    );

    const stripeChargesEnabled = chargesEnabled;

    // Only write if there’s a change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevOnboarding = Boolean((user as any).stripeOnboardingComplete);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevChargesEnabled = Boolean((user as any).stripeChargesEnabled);

    if (prevOnboarding !== stripeOnboardingComplete || prevChargesEnabled !== stripeChargesEnabled) {
      try {
        await userService.updateUser(user.id, {
          stripeOnboardingComplete,
          stripeChargesEnabled
        });

        logger.info("[stripe/connect/status] Updated user Stripe flags", {
          userId: user.id,
          stripeConnectAccountId,
          stripeOnboardingComplete,
          stripeChargesEnabled
        });
      } catch (error) {
        logger.error("[stripe/connect/status] Failed to update user Stripe flags", {
          userId: user.id,
          stripeConnectAccountId,
          error
        });
        // We still return the flags to the client even if persistence failed
      }
    }

    return NextResponse.json(
      {
        stripeOnboardingComplete,
        stripeChargesEnabled
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    logger.error("[stripe/connect/status] Failed to refresh Stripe status", error);
    return NextResponse.json(
      {
        message: "Unable to retrieve Stripe status",
        stripeOnboardingComplete: false,
        stripeChargesEnabled: false
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
