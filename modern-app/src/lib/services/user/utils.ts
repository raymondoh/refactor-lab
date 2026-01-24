// src/lib/services/user/utils.ts
import type { User } from "@/lib/types/user";
import type { Certification } from "@/lib/types/certification";
import type { UserRole } from "@/lib/auth/roles";
import { Timestamp } from "firebase-admin/firestore";
import { JOB_SERVICE_TYPES, type JobServiceType } from "@/lib/config/locations";

interface FirestoreCertification {
  name: string;
  issuingBody: string;
  fileUrl?: string | null;
  verified?: boolean;
  verification?: {
    checkedAt?: Timestamp | Date | null;
    [key: string]: unknown;
  } | null;
  verifiedAt?: Timestamp | Date | null;
  [key: string]: unknown;
}

interface FirestoreUserData {
  avgRating?: number;
  reviewsCount?: number;
  lastActiveAt?: Timestamp | Date;
  email: string;
  name?: string | null;
  slug?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  location?: {
    postcode?: string | null;
    town?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  postcode?: string | null;
  town?: string | null;
  address?: string | null;
  businessName?: string | null;
  serviceAreas?: string[] | null;
  specialties?: string[];

  // Raw service fields from Firestore (legacy/stringly typed)
  serviceType?: JobServiceType | null;
  serviceTypes?: JobServiceType[] | null;

  experience?: unknown;
  description?: string | null;
  hourlyRate?: unknown;
  profilePicture?: string | null;
  portfolio?: string[];
  searchKeywords?: string[];
  certifications?: Record<string, FirestoreCertification>;
  favoriteTradespeople?: string[];
  subscriptionTier?: string;

  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;

  // ✅ NEW: subscription period / cancel fields
  stripeCancelAtPeriodEnd?: boolean;
  stripeCurrentPeriodEnd?: Timestamp | Date | null;
  stripeCancelAt?: Timestamp | Date | null;

  stripeConnectAccountId?: string | null;
  stripeOnboardingComplete?: boolean;
  stripeChargesEnabled?: boolean;

  subscriptionStatus?: string | null;
  status?: string;
  monthlyQuotesUsed?: number;
  quoteResetDate?: Timestamp | Date | null;
  notificationSettings?: {
    newJobAlerts?: boolean;
    [key: string]: unknown;
  };
  role?: string;
  emailVerified?: boolean | Timestamp | Date;
  termsAcceptedAt?: Timestamp | Date;
  onboardingComplete?: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  lastLoginAt?: Timestamp | Date;
  isFeatured?: boolean;
  featureExpiresAt?: Timestamp | Date;
  [key: string]: unknown;
}

const tsToDate = (value: Timestamp | Date | null | undefined): Date | null | undefined => {
  if (typeof value === "object" && value !== null) {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
  }
  return value ?? undefined;
};

// Type guard to ensure only valid JobServiceType values survive
const isJobServiceType = (value: unknown): value is JobServiceType => {
  return typeof value === "string" && JOB_SERVICE_TYPES.includes(value as JobServiceType);
};

export function mapToUser(id: string, data: Record<string, unknown>): User {
  const d = data as FirestoreUserData;

  let emailVerifiedDate: Date | null = null;
  if (d.emailVerified) {
    if (typeof d.emailVerified === "object" && d.emailVerified instanceof Timestamp) {
      emailVerifiedDate = d.emailVerified.toDate();
    } else if (typeof d.emailVerified === "object" && d.emailVerified instanceof Date) {
      emailVerifiedDate = d.emailVerified;
    } else if (typeof d.emailVerified === "boolean" && d.emailVerified) {
      emailVerifiedDate = tsToDate(d.updatedAt) ?? new Date();
    }
  }

  // Ensure rawLocation is typed as a Record so we can access properties safely
  const rawLocation = (typeof d.location === "object" && d.location !== null ? d.location : {}) as Record<
    string,
    unknown
  >;

  const normalizeLocationString = (value: unknown): string | null =>
    typeof value === "string" && value.trim().length > 0 ? value : null;

  // Safely extract coordinates with explicit type casting
  const latitudeValue =
    (rawLocation.latitude as number | null | undefined) ?? (d.latitude as number | null | undefined);
  const longitudeValue =
    (rawLocation.longitude as number | null | undefined) ?? (d.longitude as number | null | undefined);

  // 🔹 Normalise primary serviceType
  const normalizedServiceType: JobServiceType | null =
    d.serviceType && isJobServiceType(d.serviceType) ? d.serviceType : null;

  // 🔹 Normalise serviceTypes[] (keep only valid values)
  const normalizedServiceTypes: JobServiceType[] | null = Array.isArray(d.serviceTypes)
    ? d.serviceTypes.filter(isJobServiceType)
    : null;

  return {
    id,
    avgRating: typeof d.avgRating === "number" ? d.avgRating : null,
    reviewsCount: typeof d.reviewsCount === "number" ? d.reviewsCount : null,
    lastActiveAt: tsToDate(d.lastActiveAt) ?? undefined,
    email: d.email,
    name: d.name || null,
    slug: d.slug || undefined,
    firstName: d.firstName || null,
    lastName: d.lastName || null,
    phone: d.phone || null,
    location: {
      postcode: normalizeLocationString(rawLocation.postcode) ?? normalizeLocationString(d.postcode) ?? null,
      town: normalizeLocationString(rawLocation.town) ?? normalizeLocationString(d.town) ?? null,
      address: normalizeLocationString(rawLocation.address) ?? normalizeLocationString(d.address) ?? null,
      latitude: typeof latitudeValue === "number" ? latitudeValue : null,
      longitude: typeof longitudeValue === "number" ? longitudeValue : null
    },
    businessName: d.businessName || null,
    businessId: typeof (d as any).businessId === "string" ? (d as any).businessId : null,
    serviceAreas: Array.isArray(d.serviceAreas)
      ? d.serviceAreas.join(", ")
      : (d.serviceAreas as unknown as string) || null,
    specialties: d.specialties || [],
    experience: typeof d.experience === "string" ? d.experience : null,
    description: d.description || null,
    hourlyRate: typeof d.hourlyRate === "string" ? d.hourlyRate : null,
    profilePicture: d.profilePicture || null,
    portfolio: d.portfolio || [],
    searchKeywords: d.searchKeywords || [],

    // 🔹 Typed service fields
    serviceType: normalizedServiceType,
    serviceTypes: normalizedServiceTypes,

    certifications: d.certifications
      ? Object.entries(d.certifications).map(([certId, cert]) => {
          const c = cert as FirestoreCertification;
          const verification = c.verification
            ? {
                ...c.verification,
                checkedAt: tsToDate(c.verification.checkedAt) ?? null
              }
            : (c.verification ?? null);

          return {
            id: certId,
            name: c.name,
            issuingBody: c.issuingBody,
            fileUrl: c.fileUrl ?? null,
            verified: c.verified,
            verifiedAt: tsToDate(c.verifiedAt) ?? null,
            verification
          } as Certification;
        })
      : [],
    favoriteTradespeople: d.favoriteTradespeople || [],
    notificationSettings: d.notificationSettings
      ? {
          newJobAlerts:
            typeof d.notificationSettings.newJobAlerts === "boolean" ? d.notificationSettings.newJobAlerts : undefined
        }
      : undefined,

    subscriptionTier: (d.subscriptionTier as User["subscriptionTier"]) || "basic",
    subscriptionStatus: (d.subscriptionStatus as User["subscriptionStatus"]) || null,

    stripeCustomerId: d.stripeCustomerId || null,
    stripeSubscriptionId: d.stripeSubscriptionId || null,

    // ✅ NEW: map Stripe subscription dates/flags correctly
    stripeCancelAtPeriodEnd: typeof d.stripeCancelAtPeriodEnd === "boolean" ? d.stripeCancelAtPeriodEnd : false,
    stripeCurrentPeriodEnd: tsToDate(d.stripeCurrentPeriodEnd) ?? null,
    stripeCancelAt: tsToDate(d.stripeCancelAt) ?? null,

    stripeConnectAccountId: d.stripeConnectAccountId || null,
    stripeOnboardingComplete: d.stripeOnboardingComplete ?? false,
    stripeChargesEnabled: d.stripeChargesEnabled ?? false,

    status: (d.status as User["status"]) || "active",
    monthlyQuotesUsed: d.monthlyQuotesUsed ?? 0,
    quoteResetDate: tsToDate(d.quoteResetDate) ?? null,
    hasSubmittedQuote: Boolean(d.hasSubmittedQuote),
    role: (d.role as UserRole | undefined) ?? null,

    emailVerified: emailVerifiedDate,
    termsAcceptedAt: tsToDate(d.termsAcceptedAt) ?? undefined,
    onboardingComplete: d.onboardingComplete || false,
    createdAt: tsToDate(d.createdAt) ?? new Date(),
    updatedAt: tsToDate(d.updatedAt) ?? new Date(),
    lastLoginAt: tsToDate(d.lastLoginAt) ?? undefined,
    isFeatured: d.isFeatured ?? false,
    featureExpiresAt: tsToDate(d.featureExpiresAt) ?? undefined
  };
}

const keywordMap: { [key: string]: string[] } = {
  "boiler repair": [
    "boiler",
    "heating",
    "gas",
    "vaillant",
    "worcester bosch",
    "baxi",
    "ideal",
    "no hot water",
    "pressure"
  ],
  "gas safety checks": ["gas safe", "landlord certificate", "cp12"],
  "leak detection": ["leak", "leaking", "pipe", "water damage", "damp"],
  "bathroom tiling": ["tiler", "tiling", "grouting", "ceramics", "bathroom fitters"],
  "floor tiling": ["tiler", "tiling", "floor", "kitchen"]
};

export function generateKeywords(data: Partial<User>): string[] {
  const keywords = new Set<string>();

  keywords.add("tradesperson");
  if (data.role === "tradesperson") {
    keywords.add("plumber");
    keywords.add("plumbing");
  }

  const fieldsToProcess = [data.businessName, data.name, data.location?.town];
  for (const field of fieldsToProcess) {
    if (field) {
      field
        .toLowerCase()
        .split(/\s+/)
        .forEach(word => keywords.add(word));
    }
  }

  // 🔹 Include serviceType + serviceTypes as keywords
  const serviceTypes: string[] = [];

  // Primary service type (JobServiceType → string)
  if (data.serviceType) {
    serviceTypes.push(data.serviceType);
  }

  // Additional service types (JobServiceType[] → string[])
  if (Array.isArray(data.serviceTypes) && data.serviceTypes.length > 0) {
    serviceTypes.push(...data.serviceTypes);
  }

  for (const s of serviceTypes) {
    s.toLowerCase()
      .split(/\s+/)
      .forEach(word => keywords.add(word));
  }

  if (data.specialties) {
    for (const specialty of data.specialties) {
      const specialtyKey = specialty.toLowerCase();
      specialtyKey.split(/\s+/).forEach(word => keywords.add(word));

      if (keywordMap[specialtyKey]) {
        keywordMap[specialtyKey].forEach(keyword => keywords.add(keyword));
      }
    }
  }

  return Array.from(keywords).filter(Boolean);
}

export function score(u: Pick<User, "avgRating" | "reviewsCount">) {
  const k = 15;
  const r = u.avgRating ?? 0;
  const n = u.reviewsCount ?? 0;
  return (n / (n + k)) * r + (k / (n + k)) * 3.8;
}
