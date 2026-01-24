import { z } from "zod";
import { orderSchema } from "@/schemas/order";

// This is the main Order type used when fetching from the database
export type Order = {
  id: string;
  paymentIntentId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string; // It's good practice to make this optional
  }[];
  shippingAddress: {
    name: string; // <<< ADD THIS REQUIRED PROPERTY
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  userId: string | null; // Allow this to be null
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt?: Date;
  updatedAt?: Date;
  currency?: string; // It's good to have this here too
};

// This is the type for data used to CREATE an order, inferred from your Zod schema
export type OrderData = z.infer<typeof orderSchema>;

// This is the enum for status, which you can use elsewhere if needed
export type OrderStatus = Order["status"];
