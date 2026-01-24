export type PaymentStatus =
  | "none"
  | "checkout_pending" // created Session, waiting for completion
  | "authorized" // manual-capture auth in place
  | "paid" // captured
  | "refunded"
  | "partial_refund";

export interface PaymentMeta {
  checkoutSessionId?: string;
  paymentIntentId?: string;
  chargeId?: string;
  lastEvent?: string; // latest webhook we processed
}
