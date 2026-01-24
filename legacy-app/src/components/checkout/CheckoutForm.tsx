// src/components/checkout/CheckoutForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useStripe,
  useElements,
  CardNumberElement, // Using individual elements
  CardExpiryElement,
  CardCvcElement
} from "@stripe/react-stripe-js";
import { useSession } from "next-auth/react"; // For user session data
import { toast } from "sonner";

import { shippingFormSchema, type ShippingFormValues } from "@/schemas/ecommerce/stripe";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { TAX_RATE, SHIPPING_CONFIG, DEFAULT_CURRENCY } from "@/config/checkout";
import { CheckoutSummary } from "./checkout-summary";
import { formatPrice } from "@/lib/utils";

// Country name to ISO code mapping (still needed for Stripe's API on the frontend)
const countryNameToIso: Record<string, string> = {
  "United States": "US",
  Canada: "CA",
  "United Kingdom": "GB",
  Germany: "DE",
  France: "FR",
  Australia: "AU",
  India: "IN"
  // Add other countries as needed
};

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const { items, subtotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    }
  });

  // Effect to autopopulate fields from session data
  useEffect(() => {
    if (session?.user) {
      if (session.user.displayName || session.user.name) {
        form.setValue("fullName", session.user.displayName || session.user.name || "");
      }
      if (session.user.email) {
        form.setValue("email", session.user.email);
      }
      const phone = (session.user as any).phone;
      if (phone) {
        form.setValue("phone", phone);
      }
    }
  }, [session, form]);

  const tax = subtotal * TAX_RATE; // Example tax calculation
  const shippingCost = subtotal > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;
  const total = subtotal + tax + shippingCost; // This is an estimate for display

  async function onSubmit(values: ShippingFormValues) {
    // Ensure Stripe and Elements are loaded before proceeding
    if (!stripe || !elements) {
      toast.error("Stripe is not loaded. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert country name to ISO code for Stripe (still needed on frontend)
      const isoCountry = countryNameToIso[values.country] || values.country; // Fallback

      // 1. Create Payment Intent on your backend
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(item => ({ id: item.product.id, quantity: item.quantity })),
          currency: DEFAULT_CURRENCY.toLowerCase(),
          shipping: {
            name: values.fullName,
            phone: values.phone,
            address: {
              line1: values.address,
              city: values.city,
              state: values.state,
              postal_code: values.zipCode,
              country: isoCountry // ISO country code for backend
            }
          },
          receipt_email: values.email // Pass email for receipt
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create payment intent.");
      }

      // 2. Confirm the payment on the client side
      const { error: stripeConfirmError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement)!, // Get the mounted CardNumberElement
          billing_details: {
            name: values.fullName,
            email: values.email,
            phone: values.phone,
            address: {
              line1: values.address,
              city: values.city,
              state: values.state,
              postal_code: values.zipCode,
              country: isoCountry // ISO country code for billing address
            }
          }
        }
      });

      if (stripeConfirmError) {
        throw stripeConfirmError; // Handle errors from Stripe's confirmation (e.g., card declined)
      }

      // If payment is successful (status: 'succeeded' or 'requires_action' which Stripe handles)
      if (paymentIntent?.status === "succeeded") {
        // --- FIX: Removed clearCart() from here. It will be cleared on the success page. ---
        window.location.href = `/checkout/success?payment_intent_id=${paymentIntent.id}`; // Redirect to success page with PI ID
      } else if (paymentIntent?.status === "requires_action") {
        // --- FIX: Removed clearCart() from here. It will be cleared on the success page. ---
        window.location.href = `/checkout/success?payment_intent_id=${paymentIntent.id}`;
      } else {
        // Handle other statuses if necessary (e.g., 'requires_payment_method', 'canceled')
        throw new Error(paymentIntent?.last_payment_error?.message || "Payment did not succeed.");
      }
    } catch (err: any) {
      console.error("Payment submission error:", err);
      toast.error(err.message || "Payment failed. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Display message if cart is empty, preventing checkout form from rendering
  if (items.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <p className="text-xl font-semibold mb-4">Your cart is empty.</p>
        <Button onClick={() => (window.location.href = "/products")}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Shipping Information Fields */}
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input className="bg-background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" className="bg-background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input className="bg-background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input className="bg-background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Province</FormLabel>
                    <FormControl>
                      <Input className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip / Postal Code</FormLabel>
                    <FormControl>
                      <Input className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stripe Elements for Card Details */}
            <div className="mt-4 space-y-4 p-4 border rounded-md bg-card">
              <FormLabel className="!mt-0">Payment Details</FormLabel>
              <CardNumberElement options={{ style: { base: { fontSize: "16px" } } }} />
              <div className="grid grid-cols-2 gap-4">
                <CardExpiryElement options={{ style: { base: { fontSize: "16px" } } }} />
                <CardCvcElement options={{ style: { base: { fontSize: "16px" } } }} />
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting || !stripe} className="w-full">
              {isSubmitting ? "Processing..." : `Pay ${formatPrice(total, DEFAULT_CURRENCY)}`}
            </Button>
          </form>
        </Form>
        <CheckoutSummary subtotal={subtotal} tax={tax} shipping={shippingCost} total={total} />
      </div>
    </div>
  );
}
