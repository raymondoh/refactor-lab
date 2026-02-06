// src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { DEFAULT_CURRENCY, TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil"
});

type CheckoutItem = { id: string; quantity: number };

export async function POST(req: Request) {
  try {
    // Parse once, strongly typed
    const body = (await req.json()) as { items?: CheckoutItem[] };
    const items = body.items ?? [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    // Validate quantities early
    for (const item of items) {
      if (!item?.id || !Number.isFinite(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: "Invalid cart items." }, { status: 400 });
      }
    }

    // Optional session (do NOT require it)
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;
    const loggedInEmail = session?.user?.email ? String(session.user.email) : null;

    const db = getAdminFirestore();

    // Debug logs (temporary)
    console.log("[checkout] firestore project (env):", process.env.FIREBASE_PROJECT_ID);

    // Build server-verified line items
    let subtotal = 0;
    const simplifiedItems: { id: string; quantity: number }[] = [];
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      // Debug: confirm Firestore doc exists in THIS env/project
      const directDoc = await db.collection("products").doc(item.id).get();
      console.log("[checkout] direct doc exists?", item.id, directDoc.exists);

      const doc = await db.collection("products").doc(item.id).get();

      if (!doc.exists) {
        return NextResponse.json({ error: `Product with ID ${item.id} not found.` }, { status: 404 });
      }

      const data = doc.data() as Record<string, unknown>;

      // Minimal fields checkout needs (fallbacks protect you from legacy docs)
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

    // Manual tax as a separate line item (okay for now)
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

      shipping_address_collection: {
        allowed_countries: ["GB", "US", "CA"]
      },

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

    return NextResponse.json({ url: stripeSession.url }, { status: 200 });
  } catch (err: unknown) {
    console.error("[STRIPE_CHECKOUT_ERROR]", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
