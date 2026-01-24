// src/schemas/ecommerce/stripe.ts
import { z } from "zod";

// 1. Define schema for the raw form input (renamed from original shippingSchema)
//    This matches the flat structure of the <Input> fields in your form.
export const shippingFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"), // This is the single string address from the form
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required")
});

// 2. Define schema for Stripe's 'address' object
//    This matches the nested 'address' object required by Stripe's API.
export const stripeAddressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().length(2, "Country must be a 2-character ISO code") // Stripe requires 2-char ISO
});

// 3. Define schema for Stripe's 'shipping' object
//    This matches the overall 'shipping' object structure for PaymentIntent creation.
export const stripeShippingSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: stripeAddressSchema // This uses the nested address schema
});

// 4. Define schema for the *entire request body* sent to /api/create-payment-intent
//    This replaces the old 'paymentIntentSchema' which was too simplified.
export const paymentIntentBodySchema = z.object({
  // The 'amount' is now removed from the client-side request for security.
  // It should be calculated on the backend based on the items in the cart.
  items: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().int().positive()
      })
    )
    .min(1, "The cart cannot be empty."),
  currency: z.string().length(3, "Currency must be a 3-character ISO code").optional(), // e.g., 'usd', 'gbp'
  shipping: stripeShippingSchema, // Uses the Stripe-specific shipping schema
  receipt_email: z.string().email("Invalid receipt email address").optional(), // Optional for receipt email
  return_url: z.string().url("Invalid return URL format").optional() // Optional, only if passed from client
});

// Export inferred types for convenience
export type ShippingFormValues = z.infer<typeof shippingFormSchema>;
// Rename the original PaymentIntentSchema type to reflect its new usage
export type PaymentIntentBody = z.infer<typeof paymentIntentBodySchema>;
