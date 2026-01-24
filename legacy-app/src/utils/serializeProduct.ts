// src/utils/serializeProduct.ts

import type { Product, SerializedProduct } from "@/types/product";
import { formatDate } from "@/utils/date";
import { Timestamp } from "firebase-admin/firestore";

function toDate(value: string | Date | Timestamp | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "string" || value instanceof Date) return new Date(value);
  return undefined;
}

export function serializeProduct(product: Product): SerializedProduct {
  return {
    ...product,
    createdAt: formatDate(toDate(product.createdAt)) ?? new Date().toISOString(),
    updatedAt: formatDate(toDate(product.updatedAt)) ?? new Date().toISOString()
  };
}

export function serializeProductArray(products: Product[]): SerializedProduct[] {
  return products.map(serializeProduct);
}
// Let me know if you’d prefer createdAt and updatedAt to stay as actual ISO strings (.toISOString()), or formatted display strings like "Apr 14, 2025". Happy to adjust accordingly!
