// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { UsersCollection, JobsCollection, getFirebaseAdminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { userService } from "@/lib/services/user-service";
import { emailService } from "@/lib/email/email-service";
import type { PaymentStatus, PaymentRecord } from "@/lib/types/job";
import { asTier, Tier, deriveRoleFromTier } from "@/lib/subscription/tier";
import type { SubscriptionStatus, UpdateUserData, User } from "@/lib/types/user";
import { logger } from "@/lib/logger";
import { FieldValue } from "firebase-admin/firestore";

const env = getEnv();
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
logger.info("[stripe/webhook] module loaded");

/* -------------------- Subscription tier helpers -------------------- */

/**
 * Gets the subscription tier from a Stripe Subscription object.
 * We now read the tier from the subscription's METADATA.
 * The function signature is corrected to return `Tier | undefined`,
 * which includes "basic", "pro", and "business".
 */
interface JobDocWithPayments {
  payments?: PaymentRecord[];
}
type SubWithPeriods = Stripe.Subscription & {
  current_period_end?: number | null;
  cancel_at?: number | null;
};

function getSubPeriodFields(sub: Stripe.Subscription) {
  const s = sub as SubWithPeriods;

  const stripeCurrentPeriodEnd =
    typeof s.current_period_end === "number" ? new Date(s.current_period_end * 1000) : null;

  const stripeCancelAt = typeof s.cancel_at === "number" ? new Date(s.cancel_at * 1000) : null;

  return {
    stripeCurrentPeriodEnd,
    stripeCancelAt,
    stripeCancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    currentPeriodEndUnix: typeof s.current_period_end === "number" ? s.current_period_end : null,
    cancelAtUnix: typeof s.cancel_at === "number" ? s.cancel_at : null
  };
}

function tierFromSubscription(sub: Stripe.Subscription): Tier | undefined {
  logger.info("[DEBUG] tierFromSubscription running...", { subId: sub.id });
  // 1. Try subscription-level metadata (most reliable)
  const metaTier = asTier(sub.metadata?.tier);
  if (metaTier) {
    logger.info(`[DEBUG] tierFromSubscription: Found tier "${metaTier}" from subscription metadata.`);
    return metaTier; // No longer filter out "basic"
  }

  // 2. Fallback: Check the price-level metadata on the first item
  const priceMetaTier = asTier(sub.items?.data?.[0]?.price?.metadata?.tier);
  if (priceMetaTier) {
    logger.info(`[DEBUG] tierFromSubscription: Found tier "${priceMetaTier}" from price metadata.`);
    return priceMetaTier; // No longer filter out "basic"
  }

  // 3. Fallback: Check the (unreliable) Price ID mapping
  // This is kept just in case old subscriptions exist without metadata.
  const priceId = sub.items?.data?.[0]?.price?.id;
  logger.warn("[DEBUG] tierFromSubscription: Tier not found in metadata, falling back to Price ID mapping.", {
    priceId
  });
  if (priceId) {
    const proMonthly = env.STRIPE_PRO_PRICE_MONTHLY;
    const proYearly = env.STRIPE_PRO_PRICE_YEARLY;
    const businessMonthly = env.STRIPE_BUSINESS_PRICE_MONTHLY;
    const businessYearly = env.STRIPE_BUSINESS_PRICE_YEARLY;

    if (priceId === proMonthly || priceId === proYearly) {
      logger.info('[DEBUG] tierFromSubscription: Matched "pro" from Price ID.');
      return "pro";
    }
    if (priceId === businessMonthly || priceId === businessYearly) {
      logger.info('[DEBUG] tierFromSubscription: Matched "business" from Price ID.');
      return "business";
    }
    // Note: This fallback doesn't map "basic" prices, so it's incomplete
  }

  logger.warn("[stripe/webhook] Could not determine tier from subscription", { subId: sub.id });
  return undefined;
}

/**
 * Correct the return type to `Promise<Tier | undefined>`.
 */
async function tierFromCheckoutSession(session: Stripe.Checkout.Session): Promise<Tier | undefined> {
  logger.info("[DEBUG] tierFromCheckoutSession running...", { sessionId: session.id });
  // Metadata is the primary source of truth, set during checkout creation
  const metaTier = asTier(session.metadata?.tier);
  if (metaTier) {
    logger.info(`[DEBUG] tierFromCheckoutSession: Found tier "${metaTier}" from session metadata.`);
    return metaTier; // No longer filter out "basic"
  }

  // Fallback: Expand line items to check price metadata
  logger.warn(
    "[DEBUG] tierFromCheckoutSession: Tier not found in session metadata, falling back to expanding line items."
  );
  try {
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price"]
    });
    const priceMetaTier = asTier(full?.line_items?.data?.[0]?.price?.metadata?.tier);
    if (priceMetaTier) {
      logger.info(`[DEBUG] tierFromCheckoutSession: Found tier "${priceMetaTier}" from expanded price metadata.`);
      return priceMetaTier; // No longer filter out "basic"
    }
  } catch (e: unknown) {
    logger.warn("[stripe/webhook] Could not expand checkout session line items", { sessionId: session.id, error: e });
  }

  logger.warn("[stripe/webhook] Could not determine tier from checkout session", { sessionId: session.id });
  return undefined;
}

async function notifySubscriptionUpgrade(userId: string, tier: Tier, userOverride?: Partial<User> | null) {
  if (!tier || tier === "basic") {
    logger.info("[DEBUG] notifySubscriptionUpgrade: Skipping email, tier is basic or undefined.", { tier });
    return;
  }

  try {
    logger.info("[DEBUG] notifySubscriptionUpgrade: Preparing to send upgrade email.", { userId, tier });
    const upgradedUser = userOverride ?? (await userService.getUserById(userId));
    if (!upgradedUser?.email) {
      logger.warn("[DEBUG] notifySubscriptionUpgrade: Cannot send email, user has no email.", { userId });
      return;
    }

    const nameParts = [upgradedUser.firstName, upgradedUser.lastName].filter(Boolean) as string[];
    const derivedName = (upgradedUser.name ?? "").trim() || nameParts.join(" ").trim() || "there";

    await emailService.sendSubscriptionUpgradedEmail(upgradedUser.email, derivedName, tier);
    logger.info("[DEBUG] notifySubscriptionUpgrade: Upgrade email sent successfully.", {
      userId,
      email: upgradedUser.email
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown email upgrade error";
    logger.error(`Webhook Error: Failed to send subscription upgraded email for user ${userId}`, error);
    logger.error("[stripe/webhook] Failed to send subscription upgraded email", {
      userId,
      message,
      error
    });
  }
}

async function writeWithRetry(action: () => Promise<unknown>, description: string, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await action();
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (i === attempts) {
        logger.error(`Firestore write failed for ${description}`, err);
        logger.error("[stripe/webhook] Firestore write failed", { description, message, error: err });

        if (process.env.ALERT_WEBHOOK_URL) {
          try {
            await fetch(process.env.ALERT_WEBHOOK_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: `Firestore write failed for ${description}`,
                context: { description, ts: new Date().toISOString(), message }
              })
            });
          } catch (alertErr: unknown) {
            const alertMsg = alertErr instanceof Error ? alertErr.message : String(alertErr);
            logger.error("Alerting failed", alertErr);
            logger.error("[stripe/webhook] Alerting failed", { description, message: alertMsg, error: alertErr });
          }
        }
      } else {
        await new Promise(res => setTimeout(res, 100 * i));
      }
    }
  }
}

async function isEventProcessed(eventId: string): Promise<boolean> {
  if (!eventId) return true; // Don't process events without IDs

  try {
    const db = getFirebaseAdminDb();
    const eventRef = db.collection(COLLECTIONS.ACTIVITY_LOGS).doc(eventId);
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
      logger.info(`[DEBUG] Event ${eventId} already processed, skipping.`);
      return true;
    }

    await writeWithRetry(
      () => eventRef.set({ processedAt: FieldValue.serverTimestamp() }),
      `Set event ${eventId} as processed`
    );
    return false;
  } catch (error) {
    logger.error("[stripe/webhook] Event deduplication check error", error);
    return true; // Failsafe: assume processed if check fails
  }
}

/* -------------------- Handlers -------------------- */

async function handleSubscriptionUpdate(sub: Stripe.Subscription) {
  logger.info("[DEBUG] handleSubscriptionUpdate running...", {
    subId: sub.id,
    status: sub.status
  });

  // Webhook payloads can be partial. Retrieve the full subscription.
  let fullSub: Stripe.Subscription;
  try {
    fullSub = await stripe.subscriptions.retrieve(sub.id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("[stripe/webhook] Failed to retrieve full subscription", {
      subId: sub.id,
      message,
      error: err
    });
    return;
  }

  const customerId = typeof fullSub.customer === "string" ? fullSub.customer : fullSub.customer.id;
  const userId = fullSub.metadata?.userId;
  const status = fullSub.status as SubscriptionStatus;

  const { stripeCurrentPeriodEnd, stripeCancelAt, stripeCancelAtPeriodEnd, currentPeriodEndUnix, cancelAtUnix } =
    getSubPeriodFields(fullSub);

  logger.info("[stripe/webhook] sub period fields (typed helper)", {
    subId: fullSub.id,
    cancelAtPeriodEnd: stripeCancelAtPeriodEnd,
    currentPeriodEndUnix,
    cancelAtUnix
  });

  const tier = tierFromSubscription(fullSub);
  logger.info("[DEBUG] handleSubscriptionUpdate: Tier retrieved.", { tier });

  if (!userId) {
    logger.warn("[stripe/webhook] Subscription update missing metadata.userId", {
      customerId,
      subscriptionId: fullSub.id
    });
    return;
  }

  const currentUser = await userService.getUserById(userId);
  if (!currentUser) {
    logger.error("[stripe/webhook] handleSubscriptionUpdate: No user found for userId.", {
      userId,
      customerId,
      subscriptionId: fullSub.id
    });
    return;
  }

  const previousTier = asTier(currentUser.subscriptionTier);
  logger.info("[DEBUG] handleSubscriptionUpdate: Fetched current user.", {
    userId,
    previousTier
  });

  const updateData: UpdateUserData = {
    subscriptionStatus: status,
    stripeSubscriptionId: fullSub.id,

    // keep customer id in sync (optional but useful)
    stripeCustomerId: customerId ?? currentUser.stripeCustomerId ?? null,

    // ✅ persist the 3 fields you want to display
    stripeCancelAtPeriodEnd,
    stripeCurrentPeriodEnd,
    stripeCancelAt
  };

  if (tier) {
    updateData.subscriptionTier = tier;
    updateData.role = deriveRoleFromTier(tier, currentUser.role);
  } else {
    logger.warn("[DEBUG] handleSubscriptionUpdate: No tier found, subscriptionTier will not be updated.", {
      subId: fullSub.id,
      status
    });
  }

  logger.info("[DEBUG] handleSubscriptionUpdate: Calling userService.updateUser...", {
    userId,
    updateData: JSON.stringify(updateData)
  });

  const updatedUser = await userService.updateUser(userId, updateData);

  if (tier && tier !== previousTier) {
    if (tier !== "basic") {
      logger.info(
        `[stripe/webhook] Upgrading user ${userId} to ${tier}. Previous: ${previousTier}. Sending upgrade email.`
      );
      await notifySubscriptionUpgrade(userId, tier, updatedUser);
    } else {
      logger.info(
        `[stripe/webhook] User ${userId} downgraded to basic from ${previousTier}. Not sending upgrade email.`
      );
    }
  } else {
    logger.info(
      `[stripe/webhook] Subscription update for ${userId}. No tier change or no valid tier. Not sending upgrade email.`,
      { newTier: tier, dbTier: previousTier }
    );
  }
}

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  logger.info("[DEBUG] handleCheckoutSession running...", { sessionId: session.id, mode: session.mode });

  const customerId = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
  const userId = session.metadata?.userId;

  if (!userId) {
    logger.warn("[stripe/webhook] checkout.session.completed missing metadata.userId", { sessionId: session.id });
    return;
  }

  if (session.mode === "subscription") {
    // Tier from metadata/expanded line items helper
    const tier = await tierFromCheckoutSession(session);
    const currentUser = await userService.getUserById(userId);

    // Resolve subscriptionId from session
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null);

    // Defaults
    let stripeCurrentPeriodEnd: Date | null = null;
    let stripeCancelAtPeriodEnd = false;
    let stripeCancelAt: Date | null = null;

    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["items.data.price"]
        });

        // If your stripe client is typed correctly, these will just work:
        const {
          stripeCurrentPeriodEnd: periodEnd,
          stripeCancelAt: cancelAt,
          stripeCancelAtPeriodEnd: cancelAtPeriodEnd
        } = getSubPeriodFields(sub);

        stripeCurrentPeriodEnd = periodEnd;
        stripeCancelAtPeriodEnd = cancelAtPeriodEnd;
        stripeCancelAt = cancelAt;

        logger.info("[DEBUG] handleCheckoutSession: Retrieved subscription fields.", {
          subscriptionId,
          current_period_end: stripeCurrentPeriodEnd ? Math.floor(stripeCurrentPeriodEnd.getTime() / 1000) : null,
          cancel_at_period_end: stripeCancelAtPeriodEnd,
          cancel_at: stripeCancelAt ? Math.floor(stripeCancelAt.getTime() / 1000) : null
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn("[stripe/webhook] Failed to retrieve subscription in checkout handler", {
          sessionId: session.id,
          subscriptionId,
          message,
          error: err
        });
      }
    } else {
      logger.warn("[stripe/webhook] checkout.session.completed had no subscription id", { sessionId: session.id });
    }

    const updateData: UpdateUserData = {
      stripeCustomerId: customerId,
      subscriptionStatus: "active",
      stripeSubscriptionId: subscriptionId,
      stripeCurrentPeriodEnd,
      stripeCancelAtPeriodEnd,
      stripeCancelAt
    };

    if (tier) {
      updateData.subscriptionTier = tier;
      updateData.role = deriveRoleFromTier(tier, currentUser?.role);
    } else {
      logger.error("[DEBUG] handleCheckoutSession: No tier found from checkout session.", { sessionId: session.id });
    }

    logger.info("[DEBUG] handleCheckoutSession: Calling userService.updateUser...", {
      userId,
      updateData: JSON.stringify(updateData)
    });

    // Persist subscription details here only.
    // Upgrade/downgrade emails should be handled by customer.subscription.updated to avoid duplicates.
    await userService.updateUser(userId, updateData);

    logger.info("[DEBUG] handleCheckoutSession: userService.updateUser complete.", { userId });
    return;
  }

  if (session.mode === "payment") {
    logger.info(
      "[DEBUG] handleCheckoutSession: Session mode is 'payment' (one-off job payment). Deferring to payment_intent.succeeded webhook."
    );
    return;
  }

  logger.warn("[DEBUG] handleCheckoutSession: Unhandled session mode.", { mode: session.mode });
}

async function handlePaymentIntent(pi: Stripe.PaymentIntent) {
  logger.info("[DEBUG] handlePaymentIntent running...", { piId: pi.id, status: pi.status });

  const { jobId, quoteId, paymentType } = pi.metadata;
  if (!jobId || !quoteId || !paymentType) {
    logger.warn("[stripe/webhook] payment_intent missing metadata", {
      paymentIntentId: pi.id,
      metadata: JSON.stringify(pi.metadata)
    });
    return;
  }

  const jobRef = JobsCollection().doc(jobId);
  const quoteRef = jobRef.collection("quotes").doc(quoteId);

  const paymentStatus: PaymentStatus = paymentType === "deposit" ? "deposit_paid" : "fully_paid";
  const paymentIntentIdField = paymentType === "deposit" ? "depositPaymentIntentId" : "finalPaymentIntentId";

  // 🔹 Resolve the charge + receipt_url safely
  let receiptUrl: string | null = null;
  try {
    let charge: Stripe.Charge | null = null;

    if (typeof pi.latest_charge === "string") {
      logger.info("[DEBUG] handlePaymentIntent: latest_charge is ID, retrieving charge.", {
        latestChargeId: pi.latest_charge
      });
      charge = await stripe.charges.retrieve(pi.latest_charge);
    } else if (pi.latest_charge && typeof pi.latest_charge === "object") {
      charge = pi.latest_charge as Stripe.Charge;
    }

    receiptUrl = charge?.receipt_url ?? null;

    if (!receiptUrl) {
      logger.warn("[DEBUG] handlePaymentIntent: No receipt_url found on charge.", {
        piId: pi.id,
        latestChargeId:
          typeof pi.latest_charge === "string" ? pi.latest_charge : (pi.latest_charge as Stripe.Charge | null)?.id
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[stripe/webhook] Failed to load charge / receipt_url for payment intent", {
      piId: pi.id,
      message,
      error
    });
  }

  const paymentRecord: PaymentRecord = {
    type: paymentType as "deposit" | "final",
    paymentIntentId: pi.id,
    amount: pi.amount,
    paidAt: new Date(pi.created * 1000),
    stripeReceiptUrl: receiptUrl
  };

  // --- Quote update: safe to overwrite (no duplication issue here) ---
  logger.info("[DEBUG] handlePaymentIntent: Writing payment info to quote...", {
    quoteId,
    paymentIntentId: pi.id
  });

  await writeWithRetry(
    () =>
      quoteRef.set(
        {
          paymentStatus: "succeeded",
          paymentIntentId: pi.id,
          paidAt: paymentRecord.paidAt
        },
        { merge: true }
      ),
    `Update quote ${quoteId} for job ${jobId}`
  );

  // --- Job update: DEDUPLICATE by (paymentIntentId, type) ---
  logger.info("[DEBUG] handlePaymentIntent: Preparing job payment update with dedupe...", {
    jobId,
    paymentIntentId: pi.id,
    paymentType
  });

  await writeWithRetry(async () => {
    const snap = await jobRef.get();
    const jobData = snap.exists ? (snap.data() as JobDocWithPayments) : undefined;

    const existingPayments: PaymentRecord[] = Array.isArray(jobData?.payments) ? jobData.payments : [];

    // Remove any existing entries for this same paymentIntentId + type
    const filtered = existingPayments.filter(
      p => !(p.paymentIntentId === paymentRecord.paymentIntentId && p.type === paymentRecord.type)
    );

    // Merge data – prefer the latest receiptUrl if present
    const existingForThisPayment = existingPayments.find(
      p => p.paymentIntentId === paymentRecord.paymentIntentId && p.type === paymentRecord.type
    );

    const mergedPayment: PaymentRecord = {
      ...(existingForThisPayment ?? {}),
      ...paymentRecord,
      stripeReceiptUrl: paymentRecord.stripeReceiptUrl ?? existingForThisPayment?.stripeReceiptUrl ?? null
    };

    const nextPayments = [...filtered, mergedPayment];

    await jobRef.set(
      {
        paymentStatus,
        [paymentIntentIdField]: pi.id,
        payments: nextPayments,
        updatedAt: new Date()
      },
      { merge: true }
    );
  }, `Update job ${jobId} with payment ${pi.id} (deduped)`);

  // --- Emails ---
  const job = (await jobRef.get()).data() as {
    title: string;
    customerId: string;
    tradespersonId: string;
  };
  const [customer, tradesperson] = await Promise.all([
    userService.getUserById(job.customerId),
    userService.getUserById(job.tradespersonId)
  ]);

  logger.info("[DEBUG] handlePaymentIntent: Sending payment emails...", { paymentType });

  // Derive simple display names (fall back to undefined so template uses "there")
  const customerName = (customer?.name ?? "").trim() || undefined;
  const tradespersonName = (tradesperson?.name ?? "").trim() || undefined;

  if (paymentType === "deposit") {
    if (customer?.email) {
      await emailService.sendDepositPaidEmail(customer.email, "customer", job.title, pi.amount / 100, customerName);
    }
    if (tradesperson?.email) {
      await emailService.sendDepositPaidEmail(
        tradesperson.email,
        "tradesperson",
        job.title,
        pi.amount / 100,
        tradespersonName
      );
    }
  } else if (paymentType === "final") {
    if (customer?.email) {
      await emailService.sendJobCompleteEmail(customer.email, jobId, customerName);
    }
    if (tradesperson?.email) {
      await emailService.sendFinalPaymentPaidEmail(tradesperson.email, job.title, pi.amount / 100, tradespersonName);
    }
  }

  logger.info("[DEBUG] handlePaymentIntent: Completed (deduped).");
}

async function handleAccountUpdate(account: Stripe.Account) {
  logger.info("[DEBUG] handleAccountUpdate running...", { accountId: account.id });
  const userId = account.metadata?.userId;
  if (!userId) {
    logger.warn("[stripe/webhook] account.updated missing metadata.userId", {
      accountId: account.id
    });
    return;
  }

  const user = await userService.getUserById(userId);
  if (!user) {
    logger.warn("[stripe/webhook] User not found for account.updated", {
      userId,
      accountId: account.id
    });
    return;
  }

  const onboardingComplete = Boolean(account.details_submitted && (account.payouts_enabled || account.charges_enabled));
  const chargesEnabled = Boolean(account.charges_enabled);

  // Only update if the state has changed
  if (user.stripeOnboardingComplete !== onboardingComplete || user.stripeChargesEnabled !== chargesEnabled) {
    logger.info("[DEBUG] handleAccountUpdate: Stripe onboarding status changed. Updating user.", {
      userId,
      onboardingComplete,
      chargesEnabled
    });
    await userService.updateUser(userId, {
      stripeOnboardingComplete: onboardingComplete,
      stripeChargesEnabled: chargesEnabled
    });

    // Send email only on the first time they become fully onboarded
    if (onboardingComplete && !user.stripeOnboardingComplete && user.email) {
      logger.info("[DEBUG] handleAccountUpdate: Sending onboarding success email.", { userId });
      await emailService.sendStripeOnboardingSuccessEmail(user.email, user.name || "there");
    }
  } else {
    logger.info("[DEBUG] handleAccountUpdate: No change in onboarding status.", { userId });
  }
}

async function handleSubscriptionStatusChange(sub: Stripe.Subscription, status: SubscriptionStatus) {
  logger.info("[DEBUG] handleSubscriptionStatusChange running...", { subId: sub.id, status });
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const usersSnap = await UsersCollection().where("stripeCustomerId", "==", customerId).limit(1).get();
  if (usersSnap.empty) {
    logger.warn("[DEBUG] handleSubscriptionStatusChange: No user found for customer ID.", { customerId });
    return;
  }

  const userRef = usersSnap.docs[0].ref;
  logger.info("[DEBUG] handleSubscriptionStatusChange: Updating user status in Firebase.", {
    userId: userRef.id,
    status
  });
  await userRef.update({ subscriptionStatus: status });
}

/* -------------------- Main Webhook Route -------------------- */

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    logger.warn("[stripe/webhook] Request missing stripe-signature header.");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.arrayBuffer();
    event = stripe.webhooks.constructEvent(Buffer.from(body), sig, secret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    logger.warn("[stripe/webhook] Webhook signature validation failed", { message });
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (await isEventProcessed(event.id)) {
    return NextResponse.json({ received: true, message: "Event already processed" });
  }

  logger.info(`[stripe/webhook] Received event: ${event.type}`, { eventId: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.created":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
      case "invoice.payment_action_required": {
        logger.info(`[DEBUG] Handling ${event.type}`);
        const invoice = event.data.object as Stripe.Invoice;
        let subscription: Stripe.Subscription | null = null;
        let subscriptionId: string | null = null;

        const topLevelSub = (invoice as Stripe.Invoice & { subscription?: unknown }).subscription;

        if (typeof topLevelSub === "string") {
          subscriptionId = topLevelSub;
        } else if (topLevelSub && typeof topLevelSub === "object" && "items" in topLevelSub) {
          subscription = topLevelSub as Stripe.Subscription;
        }

        if (!subscription && !subscriptionId) {
          const firstLineItem = invoice.lines?.data?.[0];
          if (firstLineItem?.subscription) {
            if (typeof firstLineItem.subscription === "string") {
              subscriptionId = firstLineItem.subscription;
            } else if (typeof firstLineItem.subscription === "object") {
              subscription = firstLineItem.subscription as Stripe.Subscription;
            }
          }
        }

        logger.info("[DEBUG] Invoice Event: Determined subscription.", {
          subId: subscription?.id,
          subIdString: subscriptionId
        });

        try {
          if (subscriptionId && !subscription) {
            logger.info("[DEBUG] Invoice Event: Retrieving subscription from ID.", { subscriptionId });
            subscription = await stripe.subscriptions.retrieve(subscriptionId);
          }

          if (subscription) {
            await handleSubscriptionStatusChange(subscription, "past_due");
          } else {
            logger.warn("[stripe/webhook] Invoice event received, but no valid subscription could be determined.", {
              invoiceId: invoice.id
            });
          }
        } catch (subErr: unknown) {
          const message = subErr instanceof Error ? subErr.message : "Failed to handle subscription logic from invoice";
          logger.error("[stripe/webhook] Error handling invoice event", {
            invoiceId: invoice.id,
            subscriptionId,
            error: subErr,
            message
          });
        }
        break;
      }

      case "payment_intent.succeeded":
        await handlePaymentIntent(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        logger.info("[stripe/webhook] payment_intent.payment_failed received", {
          piId: pi.id,
          status: pi.status,
          metadata: pi.metadata
        });
        // Later: notify customer / flag job if needed
        break;
      }

      case "account.updated":
        await handleAccountUpdate(event.data.object as Stripe.Account);
        break;

      default:
        logger.info(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`[stripe/webhook] Error handling event ${event.type}`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
