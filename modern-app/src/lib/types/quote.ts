// src/lib/types/quote.ts
export type QuoteStatus = "pending" | "accepted" | "rejected" | "expired";
export type PaymentStatus = "authorized" | "captured" | "succeeded" | "refunded" | "canceled";

export type QuoteTemplateScope = "system" | "personal" | "business";
export type QuoteTemplateCategory = "labour" | "materials" | "callout" | "warranty" | "other";
export type QuoteUnit = "hour" | "day" | "item" | "job";

export interface QuoteLineItem {
  id: string;
  label?: string | null;
  description: string;
  category?: QuoteTemplateCategory;
  unit: QuoteUnit;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  warrantyText?: string;
}

export interface QuoteTemplate {
  id: string;
  ownerUserId?: string;
  businessId?: string;
  scope: QuoteTemplateScope;

  label: string;
  category: QuoteTemplateCategory;
  description: string;

  unit: QuoteUnit;
  defaultQuantity: number;
  unitPrice: number;
  vatRate?: number;

  warrantyText?: string;
  isArchived?: boolean;

  subscriptionTierAtCreation?: "basic" | "pro" | "business";

  createdAt: string; // ISO string for API responses
  updatedAt: string; // ISO string for API responses
}

export interface Quote {
  id: string;
  jobId: string;
  tradespersonId: string;
  tradespersonName: string;
  tradespersonPhone: string;
  price: number;
  description: string;
  estimatedDuration: string;
  availableDate: Date;
  status: QuoteStatus;
  depositAmount?: number;
  lineItems?: QuoteLineItem[];
  createdAt: Date;
  updatedAt: Date;
  acceptedDate?: Date;
  rejectedDate?: Date;
}

export type CreateQuoteData = {
  jobId: string;
  price: number;
  depositAmount?: number;
  description: string;
  estimatedDuration: string;
  availableDate: Date;
  lineItems?: QuoteLineItem[];
};
