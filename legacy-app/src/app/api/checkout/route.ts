// src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { DEFAULT_CURRENCY, TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { requireEnv } from "@/lib/env";
import { logServerEvent } from "@/lib/services/logging-service";
import { fail } from "@/lib/services/service-result";

export const runtime = "nodejs";

const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

type CheckoutItem = { id: string; quantity: number };

export async function POST(req: Request) {
  // Optional session for metadata and logging
  const session = await auth();
  const userId = session?.user?.id ? String(session.user.id) : null;
  const loggedInEmail = session?.user?.email ? String(session.user.email) : null;

  try {
    const body = (await req.json()) as { items?: CheckoutItem[] };
    const items = body.items ?? [];

    if (items.length === 0) {
      return NextResponse.json(fail("VALIDATION", "Your cart is empty."), { status: 400 }); //
    }

    // Validate quantities
    for (const item of items) {
      if (!item?.id || !Number.isFinite(item.quantity) || item.quantity < 1) {
        return NextResponse.json(fail("VALIDATION", "Invalid cart items."), { status: 400 }); //
      }
    }

    const db = getAdminFirestore();
    let subtotal = 0;
    const simplifiedItems: { id: string; quantity: number }[] = [];
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      const doc = await db.collection("products").doc(item.id).get();

      if (!doc.exists) {
        return NextResponse.json(fail("NOT_FOUND", `Product ${item.id} not found.`), { status: 404 }); //
      }

      const data = doc.data() as Record<string, unknown>;
      const product = {
        id: doc.id,
        name: String(data?.name ?? "Product"),
        description: typeof data?.description === "string" ? data.description : "",
        image: typeof data?.image === "string" ? data.image : "",
        price: Number(data?.price ?? 0),
        onSale: Boolean(data?.onSale),
        salePrice: typeof data?.salePrice === "number" ? data.salePrice : undefined
      };

      const unitAmount =
        product.onSale && typeof product.salePrice === "number" && product.salePrice < product.price
          ? product.salePrice
          : product.price;

      subtotal += unitAmount * item.quantity;
      simplifiedItems.push({ id: product.id, quantity: item.quantity });

      line_items.push({
        price_data: {
          currency: (DEFAULT_CURRENCY || "gbp").toLowerCase(),
          unit_amount: Math.round(unitAmount * 100),
          product_data: {
            name: product.name,
            description: product.description,
            images: product.image ? [product.image] : []
          }
        },
        quantity: item.quantity
      });
    }

    // Tax and Shipping
    const taxAmount = Number.parseFloat((subtotal * TAX_RATE).toFixed(2));
    if (taxAmount > 0) {
      line_items.push({
        price_data: {
          currency: (DEFAULT_CURRENCY || "gbp").toLowerCase(),
          unit_amount: Math.round(taxAmount * 100),
          product_data: { name: "Tax" }
        },
        quantity: 1
      });
    }

    const shippingCost = subtotal > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      ...(loggedInEmail ? { customer_email: loggedInEmail } : {}),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/products`,
      shipping_address_collection: { allowed_countries: ["GB", "US", "CA"] },
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: shippingCost === 0 ? "Free shipping" : "Standard shipping",
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(shippingCost * 100),
              currency: (DEFAULT_CURRENCY || "gbp").toLowerCase()
            }
          }
        }
      ],
      metadata: {
        ...(userId ? { userId } : {}),
        items: JSON.stringify(simplifiedItems)
      }
    });

    // Log successful session creation
    await logServerEvent({
      type: "stripe:checkout_created",
      message: `Checkout session created for user ${userId || "guest"}`,
      userId: userId || undefined,
      context: "stripe",
      metadata: { sessionId: stripeSession.id, subtotal }
    });

    return NextResponse.json({ ok: true, url: stripeSession.url }, { status: 200 }); //
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected checkout error";

    // Standardized error logging
    await logServerEvent({
      type: "error",
      message,
      userId: userId || undefined,
      context: "stripe",
      metadata: { error: err }
    });

    return NextResponse.json(fail("UNKNOWN", message), { status: 500 }); //
  }
}
