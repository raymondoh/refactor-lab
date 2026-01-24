//src/types/ecommerce/checkout.ts
// =============================
// 📄 types/ecommerce/checkout.ts
// =============================

// Shipping details submitted in the checkout form
export type ShippingDetails = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

// Used to request a Stripe payment intent
export type PaymentIntentRequest = {
  amount: number;
  shipping: ShippingDetails;
};
