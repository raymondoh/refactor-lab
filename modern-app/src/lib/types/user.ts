// // src/lib/types/user.ts
// import type { Certification } from "./certification";
// import type { JobServiceType } from "@/lib/config/locations";
// import type { Tier } from "@/lib/subscription/tier"; // ✅ add this

// export type UserRole = "admin" | "tradesperson" | "customer" | "user" | "business_owner" | "manager";

// export type SubscriptionStatus =
//   | "active"
//   | "canceled"
//   | "incomplete"
//   | "incomplete_expired"
//   | "past_due"
//   | "trialing"
//   | "unpaid"
//   | null;

// export type UserStatus = "active" | "suspended";

// export interface User {
//   id: string;
//   name?: string | null;
//   firstName?: string | null;
//   lastName?: string | null;
//   email: string | null;
//   emailVerified?: Date | null;
//   image?: string | null;
//   role: UserRole | null;
//   disabled?: boolean;
//   phone?: string | null;
//   slug?: string | null;

//   location?: {
//     postcode?: string | null;
//     town?: string | null;
//     address?: string | null;
//     latitude?: number | null;
//     longitude?: number | null;
//   } | null;

//   onboardingComplete: boolean;

//   businessId?: string | null;
//   businessName?: string | null;
//   googleBusinessProfileUrl?: string | null;
//   serviceAreas?: string | null;
//   specialties?: string[] | null;

//   serviceType?: JobServiceType | null;
//   serviceTypes?: JobServiceType[] | null;

//   experience?: string | null;
//   description?: string | null;
//   hourlyRate?: string | null;
//   profilePicture?: string | null;
//   portfolio?: string[] | null;
//   certifications?: Certification[] | null;

//   createdAt: Date;
//   updatedAt: Date;
//   lastLoginAt?: Date | null;
//   lastActiveAt?: Date | null;

//   isFeatured?: boolean;
//   featureExpiresAt?: Date | null;

//   citySlug?: string | null;
//   serviceAreaSlugs?: string[] | null;
//   serviceSlugs?: string[] | null;

//   // ✅ Subscription and Stripe (make this consistent everywhere)
//   subscriptionTier?: Tier | null; // ✅ remove "free"
//   subscriptionStatus?: SubscriptionStatus;

//   stripeCustomerId?: string | null;
//   stripeSubscriptionId?: string | null;

//   // ✅ NEW: cancellation state & dates
//   stripeCancelAtPeriodEnd?: boolean;
//   stripeCurrentPeriodEnd?: Date | null;
//   stripeCancelAt?: Date | null;

//   stripeConnectAccountId?: string | null;
//   stripeOnboardingComplete?: boolean;
//   stripeChargesEnabled?: boolean;

//   notificationSettings?: {
//     newJobAlerts?: boolean;
//   };

//   hasSubmittedQuote?: boolean;
//   avgRating?: number | null;
//   reviewsCount?: number | null;
//   reviews?: {
//     averageRating: number;
//     count: number;
//   };

//   favoriteTradespeople?: string[];
//   termsAcceptedAt?: Date | null;

//   searchKeywords?: string[] | null;

//   quoteResetDate?: Date | null;
//   monthlyQuotesUsed?: number | null;

//   status?: UserStatus | null;
// }

// export interface CreateUserData {
//   emailVerified?: Date | null;
//   image?: string | null;
//   disabled?: boolean;
//   onboardingComplete?: boolean;

//   subscriptionTier?: Tier; // ✅ consistent
//   subscriptionStatus?: SubscriptionStatus;

//   stripeCustomerId?: string;
//   stripeSubscriptionId?: string | null; // ✅ often useful at creation
//   stripeCancelAtPeriodEnd?: boolean; // ✅ optional
//   stripeCurrentPeriodEnd?: Date | null; // ✅ optional
//   stripeCancelAt?: Date | null; // ✅ optional

//   stripeConnectAccountId?: string | null;

//   status?: UserStatus;
//   certifications?: Certification[];
// }

// export interface UpdateUserData {
//   name?: string;
//   slug?: string;
//   firstName?: string;
//   lastName?: string;
//   phone?: string | null;

//   location?: {
//     postcode?: string | null;
//     town?: string | null;
//     address?: string | null;
//     latitude?: number | null;
//     longitude?: number | null;
//   };

//   businessName?: string | null;
//   googleBusinessProfileUrl?: string | null;
//   serviceAreas?: string | null;
//   specialties?: string[];

//   serviceType?: JobServiceType | null;
//   serviceTypes?: JobServiceType[] | null;

//   experience?: string | null;
//   description?: string | null;
//   hourlyRate?: string | null;
//   profilePicture?: string | null;
//   portfolio?: string[] | null;

//   favoriteTradespeople?: string[];
//   certifications?: Certification[];

//   notificationSettings?: {
//     newJobAlerts?: boolean;
//   };

//   onboardingComplete?: boolean;
//   role?: UserRole | null;

//   citySlug?: string;
//   serviceAreaSlugs?: string[];
//   serviceSlugs?: string[];

//   // ✅ Subscription info
//   subscriptionTier?: Tier; // ✅ consistent
//   subscriptionStatus?: SubscriptionStatus;

//   stripeCustomerId?: string | null;
//   stripeConnectAccountId?: string | null;
//   stripeSubscriptionId?: string | null;

//   // ✅ NEW fields you added in webhook
//   stripeCancelAtPeriodEnd?: boolean;
//   stripeCurrentPeriodEnd?: Date | null;
//   stripeCancelAt?: Date | null;

//   stripeOnboardingComplete?: boolean;
//   stripeChargesEnabled?: boolean;

//   status?: UserStatus;

//   monthlyQuotesUsed?: number;
//   quoteResetDate?: Date | null;
//   hasSubmittedQuote?: boolean;

//   isFeatured?: boolean;
//   featureExpiresAt?: Date | null;

//   termsAcceptedAt?: Date;
// }
// src/lib/types/user.ts
import type { Certification } from "./certification";
import type { JobServiceType } from "@/lib/config/locations";
import type { Tier } from "@/lib/subscription/tier";

export type UserRole = "admin" | "tradesperson" | "customer" | "user" | "business_owner" | "manager";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "trialing"
  | "unpaid"
  | null;

export type UserStatus = "active" | "suspended";

export interface User {
  id: string;

  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;

  email: string | null;
  emailVerified?: Date | null;

  image?: string | null;
  profilePicture?: string | null;

  role: UserRole | null;
  disabled?: boolean;

  phone?: string | null;
  slug?: string | null;

  location?: {
    postcode?: string | null;
    town?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;

  onboardingComplete: boolean;

  businessId?: string | null;
  businessName?: string | null;
  googleBusinessProfileUrl?: string | null;

  serviceAreas?: string | null;
  specialties?: string[] | null;

  serviceType?: JobServiceType | null;
  serviceTypes?: JobServiceType[] | null;

  experience?: string | null;
  description?: string | null;
  hourlyRate?: string | null;

  portfolio?: string[] | null;
  certifications?: Certification[] | null;

  createdAt: Date;
  updatedAt: Date;

  lastLoginAt?: Date | null;
  lastActiveAt?: Date | null;

  isFeatured?: boolean;
  featureExpiresAt?: Date | null;

  citySlug?: string | null;
  serviceAreaSlugs?: string[] | null;
  serviceSlugs?: string[] | null;

  // ✅ Subscription and Stripe
  subscriptionTier?: Tier | null;
  subscriptionStatus?: SubscriptionStatus;

  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;

  // ✅ NEW: for billing/cancellation display
  stripeCancelAtPeriodEnd?: boolean;
  stripeCurrentPeriodEnd?: Date | null;
  stripeCancelAt?: Date | null;

  stripeConnectAccountId?: string | null;
  stripeOnboardingComplete?: boolean;
  stripeChargesEnabled?: boolean;

  notificationSettings?: {
    newJobAlerts?: boolean;
  };

  hasSubmittedQuote?: boolean;

  avgRating?: number | null;
  reviewsCount?: number | null;
  reviews?: {
    averageRating: number;
    count: number;
  };

  favoriteTradespeople?: string[];

  termsAcceptedAt?: Date | null;

  searchKeywords?: string[] | null;

  quoteResetDate?: Date | null;
  monthlyQuotesUsed?: number | null;

  status?: UserStatus | null;
}

export interface CreateUserData {
  emailVerified?: Date | null;
  image?: string | null;
  disabled?: boolean;
  onboardingComplete?: boolean;

  subscriptionTier?: Tier;
  subscriptionStatus?: SubscriptionStatus;

  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;

  // ✅ NEW
  stripeCancelAtPeriodEnd?: boolean;
  stripeCurrentPeriodEnd?: Date | null;
  stripeCancelAt?: Date | null;

  stripeConnectAccountId?: string | null;
  stripeOnboardingComplete?: boolean;
  stripeChargesEnabled?: boolean;

  status?: UserStatus;
  certifications?: Certification[];
}

export interface UpdateUserData {
  name?: string;
  slug?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;

  location?: {
    postcode?: string | null;
    town?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };

  businessName?: string | null;
  googleBusinessProfileUrl?: string | null;
  serviceAreas?: string | null;
  specialties?: string[];

  serviceType?: JobServiceType | null;
  serviceTypes?: JobServiceType[] | null;

  experience?: string | null;
  description?: string | null;
  hourlyRate?: string | null;
  profilePicture?: string | null;
  portfolio?: string[] | null;

  favoriteTradespeople?: string[];
  certifications?: Certification[];

  notificationSettings?: {
    newJobAlerts?: boolean;
  };

  onboardingComplete?: boolean;
  role?: UserRole | null;

  citySlug?: string;
  serviceAreaSlugs?: string[];
  serviceSlugs?: string[];

  // ✅ Subscription info
  subscriptionTier?: Tier;
  subscriptionStatus?: SubscriptionStatus;

  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeConnectAccountId?: string | null;

  // ✅ NEW fields
  stripeCancelAtPeriodEnd?: boolean;
  stripeCurrentPeriodEnd?: Date | null;
  stripeCancelAt?: Date | null;

  stripeOnboardingComplete?: boolean;
  stripeChargesEnabled?: boolean;

  status?: UserStatus;

  monthlyQuotesUsed?: number;
  quoteResetDate?: Date | null;
  hasSubmittedQuote?: boolean;

  isFeatured?: boolean;
  featureExpiresAt?: Date | null;

  termsAcceptedAt?: Date;
}
