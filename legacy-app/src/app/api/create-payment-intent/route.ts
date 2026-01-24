// src/app/api/create-payment-intent/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { paymentIntentBodySchema } from "@/schemas/ecommerce/stripe";
import { DEFAULT_CURRENCY, TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout";
import { getProductById } from "@/firebase/admin/products"; // Import the server-side function to get product details

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-05-28.basil" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Validate only the incoming structure from the client (items, shipping, receipt_email)
    const { items, shipping, receipt_email, currency } = paymentIntentBodySchema.parse(body);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty. Cannot create payment intent." }, { status: 400 });
    }

    let calculatedSubtotal = 0;
    // --- FIX: Simplify itemsForMetadata to only store productId and quantity ---
    const simplifiedItemsForMetadata: { id: string; quantity: number }[] = [];
    // --- END FIX ---

    // Securely fetch product prices from your backend/database
    for (const clientItem of items) {
      const productResult = await getProductById(clientItem.id);

      if (!productResult.success || !productResult.product) {
        return NextResponse.json({ error: `Product with ID ${clientItem.id} not found.` }, { status: 404 });
      }

      const product = productResult.product;
      // Use the actual price from the backend, prioritizing salePrice if applicable
      const itemPrice = product.onSale && typeof product.salePrice === "number" ? product.salePrice : product.price;

      calculatedSubtotal += itemPrice * clientItem.quantity;

      // --- FIX: Only push essential data to metadata array ---
      simplifiedItemsForMetadata.push({
        id: product.id,
        quantity: clientItem.quantity
      });
      // --- END FIX ---
    }

    // Calculate tax and shipping on the server
    const taxAmount = parseFloat((calculatedSubtotal * TAX_RATE).toFixed(2));
    const shippingCost = calculatedSubtotal > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;
    const totalAmount = calculatedSubtotal + taxAmount + shippingCost;

    // Convert total amount to cents (Stripe requires integer in smallest currency unit)
    const amountInCents = Math.round(totalAmount * 100);

    // Await the session to get the actual user ID
    const authModule = await import("@/auth");
    const session = await authModule.auth();
    const userId = session?.user?.id || null; // Will be string or null

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: currency || DEFAULT_CURRENCY.toLowerCase(),
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
      receipt_email: receipt_email,
      metadata: {
        // --- FIX: Store simplified items in metadata ---
        items: JSON.stringify(simplifiedItemsForMetadata),
        // --- END FIX ---
        totalAmount: totalAmount.toFixed(2),
        subtotal: calculatedSubtotal.toFixed(2),
        tax: taxAmount.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        customerEmail: receipt_email ?? "", // Ensure string for metadata
        customerName: shipping.name,
        userId: userId // Use the awaited userId here
      }
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("[STRIPE_ERROR]", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data. Please check your shipping details.", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message || "Failed to create payment intent." }, { status: 500 });
  }
}
