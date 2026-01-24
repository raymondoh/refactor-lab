// src/schemas/order/order.ts
import { z } from "zod";

export const orderSchema = z.object({
  userId: z.string().nullable().optional(),
  paymentIntentId: z.string(),
  amount: z.number(),
  customerEmail: z.string().email(),
  customerName: z.string(),
  items: z
    .array(
      z.object({
        // --- ADD THIS LINE ---
        productId: z.string(),
        // ---------------------
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
        image: z.string().optional()
      })
    )
    .optional(),
  shippingAddress: z
    .object({
      name: z.string(),
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string()
    })
    .optional(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
  currency: z.string().optional()
});

export type OrderData = z.infer<typeof orderSchema>;
