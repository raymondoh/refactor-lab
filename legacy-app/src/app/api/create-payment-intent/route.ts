// legacy-app/src/app/api/create-payment-intent/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { paymentIntentBodySchema } from "@/schemas/ecommerce/stripe";
import { DEFAULT_CURRENCY, TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout";
import { adminProductService } from "@/lib/services/admin-product-service";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-05-28.basil" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, shipping, receipt_email, currency } = paymentIntentBodySchema.parse(body);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty. Cannot create payment intent." }, { status: 400 });
    }

    let calculatedSubtotal = 0;
    const simplifiedItemsForMetadata: { id: string; quantity: number }[] = [];

    // Securely fetch product prices from backend
    for (const clientItem of items) {
      const productResult = await adminProductService.getProductById(clientItem.id);

      if (!productResult.success) {
        return NextResponse.json({ error: `Product with ID ${clientItem.id} not found.` }, { status: 404 });
      }

      const product = productResult.data.product;
      const itemPrice = product.onSale && typeof product.salePrice === "number" ? product.salePrice : product.price;

      calculatedSubtotal += itemPrice * clientItem.quantity;

      simplifiedItemsForMetadata.push({
        id: product.id,
        quantity: clientItem.quantity
      });
    }

    const taxAmount = Number.parseFloat((calculatedSubtotal * TAX_RATE).toFixed(2));
    const shippingCost = calculatedSubtotal > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;
    const totalAmount = calculatedSubtotal + taxAmount + shippingCost;

    // Stripe expects smallest currency unit
    const amountInCents = Math.round(totalAmount * 100);

    // Session (best-effort). Use string only in metadata.
    const { auth } = await import("@/auth");
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : "";

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: (currency || DEFAULT_CURRENCY).toLowerCase(),
      automatic_payment_methods: { enabled: true },

      shipping: {
        name: shipping.name,
        phone: shipping.phone,
        address: {
          line1: shipping.address.line1,
          city: shipping.address.city,
          state: shipping.address.state,
          postal_code: shipping.address.postal_code,
          country: shipping.address.country
        }
      },

      receipt_email,

      metadata: {
        items: JSON.stringify(simplifiedItemsForMetadata),
        totalAmount: totalAmount.toFixed(2),
        subtotal: calculatedSubtotal.toFixed(2),
        tax: taxAmount.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        customerEmail: receipt_email ?? "",
        customerName: shipping.name ?? "",
        userId // must be a string for Stripe metadata
      }
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("[STRIPE_ERROR]", error);
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data. Please check your shipping details.", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error?.message || "Failed to create payment intent." }, { status: 500 });
  }
}
