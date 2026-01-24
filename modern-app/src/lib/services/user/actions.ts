// src/lib/services/user/actions.ts
"use server";

import { getFirebaseAdminAuth, UsersCollection, COLLECTIONS } from "@/lib/firebase/admin";
import { FieldPath } from "firebase-admin/firestore";
import { toUniqueSlug } from "@/lib/utils/slugify-server";
import type { User, UpdateUserData } from "@/lib/types/user";
import type { UserRole } from "@/lib/auth/roles";
import type { Certification } from "@/lib/types/certification";
import { geocodingService } from "@/lib/services/geocoding-service";
import { generateKeywords } from "./utils";
import { mapToUser } from "./utils";
import { logger } from "@/lib/logger";
import type { Job } from "@/lib/types/job";
import bcrypt from "bcryptjs";
import { asTier } from "@/lib/subscription/tier";

export async function findOrCreateUser(data: {
  email: string;
  name: string;
  businessName?: string | null;
  profilePicture?: string | null;
  authProvider?: string;
  role?: UserRole; // now optional
}): Promise<User | null> {
  try {
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      return existingUser;
    }

    const adminAuth = getFirebaseAdminAuth();
    const userRecord = await adminAuth.createUser({
      email: data.email,
      displayName: data.name,
      photoURL: data.profilePicture || undefined,
      emailVerified: true
    });

    // Build a Firestore payload that does NOT require role
    const userData = {
      email: data.email.toLowerCase(),
      name: data.name,
      businessName: data.businessName || null,
      profilePicture: data.profilePicture || null,
      // Only include role if provided (e.g. some flows may pass it explicitly)
      ...(data.role ? { role: data.role } : {}),
      emailVerified: new Date(),
      onboardingComplete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      favoriteTradespeople: [] as string[],
      subscriptionTier: "basic" as const,
      subscriptionStatus: null as null,
      status: "active" as const
    };

    await UsersCollection().doc(userRecord.uid).set(userData);

    const mapped = mapToUser(userRecord.uid, userData as Record<string, unknown>);
    return mapped;
  } catch (error) {
    logger.error("!!! ERROR in findOrCreateUser:", error);
    return null;
  }
}

export async function createUser(email: string, password: string, name: string, role: UserRole): Promise<User> {
  const existingUser = await getUserByEmail(email);
  if (existingUser) throw new Error("User already exists");

  const usersCollection = UsersCollection();
  const usersSnapshot = await usersCollection.limit(1).get();
  const isFirstUser = usersSnapshot.empty;
  const assignedRole: UserRole = isFirstUser ? "admin" : role || "customer";

  const adminAuth = getFirebaseAdminAuth();
  const userRecord = await adminAuth.createUser({
    email,
    password,
    displayName: name,
    emailVerified: false
  });

  const hashedPassword = await bcrypt.hash(password, 12);

  let slug: string | undefined;
  if (assignedRole === "tradesperson") {
    slug = await toUniqueSlug(COLLECTIONS.USERS, name);
  }

  const userData: Omit<User, "id"> & { hashedPassword?: string | null } = {
    email,
    name,
    ...(slug ? { slug } : {}),
    hashedPassword,
    emailVerified: null,
    termsAcceptedAt: new Date(),
    role: assignedRole,
    favoriteTradespeople: [],
    subscriptionTier: "basic",
    stripeCustomerId: null,
    subscriptionStatus: "active",
    stripeCancelAtPeriodEnd: false,
    stripeCurrentPeriodEnd: null,
    stripeCancelAt: null,
    stripeSubscriptionId: null,
    stripeConnectAccountId: null,

    status: "active",
    monthlyQuotesUsed: 0,
    quoteResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    createdAt: new Date(),
    updatedAt: new Date(),
    onboardingComplete: false
  };

  if (assignedRole === "tradesperson") {
    userData.notificationSettings = { newJobAlerts: true };
    userData.searchKeywords = generateKeywords(userData);
  }

  await usersCollection.doc(userRecord.uid).set(userData);

  const mapped = mapToUser(userRecord.uid, userData as Record<string, unknown>);
  return mapped;
}

export async function updateUser(id: string, updates: UpdateUserData): Promise<User | null> {
  logger.info(`[userService.updateUser] Updating user ${id} with:`, updates);
  const usersCollection = UsersCollection();
  const existingDoc = await usersCollection.doc(id).get();
  if (!existingDoc.exists) {
    logger.error(`[userService.updateUser] User with id ${id} not found`);
    return null;
  }
  const existing = (existingDoc.data() || {}) as Partial<User>;
  logger.info(`[userService.updateUser] Existing user data for ${id}:`, existing);

  const updateData: UpdateUserData & { [key: string]: unknown; updatedAt: Date } = {
    ...updates,
    updatedAt: new Date()
  };

  if (updateData.location) {
    updateData.location = {
      ...(existing.location ?? {}),
      ...updateData.location
    };
  }

  const currentRole = existing.role;
  const newRole = updates.role ?? currentRole;
  if (newRole === "tradesperson") {
    const nameChanged =
      (updates.businessName !== undefined && updates.businessName !== existing.businessName) ||
      (updates.name !== undefined && updates.name !== existing.name);
    if (nameChanged) {
      const base = updates.businessName ?? updates.name ?? existing.businessName ?? existing.name;
      if (base) {
        updateData.slug = await toUniqueSlug(COLLECTIONS.USERS, base, id);
      }
    }
    const fieldsThatAffectKeywords = ["businessName", "name", "specialties", "location"];
    const keywordsNeedUpdate = fieldsThatAffectKeywords.some(field => field in updates);

    if (keywordsNeedUpdate) {
      const futureData = { ...existing, ...updates } as Partial<User>;
      updateData.searchKeywords = generateKeywords(futureData);
    }
  }

  if (Array.isArray(updateData.certifications)) {
    const certArray = updateData.certifications as Certification[];
    const certObj: Record<string, Omit<Certification, "id">> = {};
    for (const cert of certArray) {
      const { id: certId, ...rest } = cert;
      certObj[certId] = rest;
    }
    (updateData as unknown as Record<string, unknown>).certifications = certObj;
  }

  const postcodeForGeocoding = updateData.location?.postcode ?? existing.location?.postcode;

  if (
    postcodeForGeocoding &&
    (updateData.location?.latitude === undefined || updateData.location?.longitude === undefined)
  ) {
    try {
      logger.info(`[userService.updateUser] Geocoding postcode for user ${id}:`, postcodeForGeocoding);
      const geoResult = await geocodingService.getCoordinatesFromPostcode(postcodeForGeocoding);
      if (geoResult && updateData.location) {
        updateData.location.latitude = geoResult.coordinates.latitude;
        updateData.location.longitude = geoResult.coordinates.longitude;
        logger.info(`[userService.updateUser] Geocoding successful for user ${id}:`, geoResult.coordinates);
      } else {
        logger.warn(`[userService.updateUser] Geocoding failed for user ${id}`);
      }
    } catch (geoError) {
      logger.warn("UserService: Geocoding failed, continuing without coordinates:", geoError);
    }
  }

  const removeUndefined = (obj: Record<string, unknown>): void => {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value === undefined) {
        delete obj[key];
      } else if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        removeUndefined(value as Record<string, unknown>);
      }
    });
  };
  removeUndefined(updateData);

  logger.info(`[userService.updateUser] Final update payload for user ${id}:`, updateData);
  await usersCollection.doc(id).update(updateData);
  logger.info("[userService.updateUser] Firestore update complete", { userId: id });

  return getUserById(id);
}

// Helper: normalize string to lower-case, trimmed
function normalize(value: string | null | undefined): string {
  return value ? value.trim().toLowerCase() : "";
}

// Very simple London region heuristic based on postcode prefix
type LondonRegion = "north" | "south" | "east" | "west" | "central";

/**
 * Try to infer a London region (north/south/east/west/central)
 * from a postcode prefix like "W11", "SW2", "EC1" etc.
 */
function deriveLondonRegion(postcodePrefix: string | null | undefined): LondonRegion | null {
  const p = normalize(postcodePrefix).toUpperCase();
  if (!p) return null;

  // Central-ish first
  if (p.startsWith("EC") || p.startsWith("WC") || /^W1/.test(p)) {
    return "central";
  }

  if (p.startsWith("NW") || p.startsWith("N")) return "north";
  if (p.startsWith("SE") || p.startsWith("SW")) return "south";
  if (p.startsWith("E")) return "east";
  if (p.startsWith("W")) return "west";

  return null;
}

export async function findMatchingTradespeople(job: Job): Promise<{
  businessTier: User[];
  proTier: User[];
  basicTier: User[];
}> {
  const usersCollection = UsersCollection();

  const tradespeopleSnapshot = await usersCollection
    .where("role", "==", "tradesperson")
    .where("notificationSettings.newJobAlerts", "==", true)
    .get();

  if (tradespeopleSnapshot.empty) {
    logger.info("[Job Alerts] No tradespeople opted-in for new job alerts.");
    return { businessTier: [], proTier: [], basicTier: [] };
  }

  const jobPostcodePrefix = normalize(job.location?.postcode?.split(" ")[0] ?? null);
  const jobServiceType = normalize(job.serviceType);
  const jobTown = normalize(job.location?.town);
  const jobCitySlug = normalize(job.citySlug);

  // If we don't have enough info, bail early (but log why)
  if (!jobPostcodePrefix || !jobServiceType) {
    logger.info("[Job Alerts] Skipping matching due to missing data", {
      jobId: job.id,
      jobTitle: job.title,
      jobPostcodePrefix,
      jobServiceType
    });
    return { businessTier: [], proTier: [], basicTier: [] };
  }

  const jobLondonRegion = jobCitySlug === "london" ? deriveLondonRegion(jobPostcodePrefix) : null;

  const businessTier: User[] = [];
  const proTier: User[] = [];
  const basicTier: User[] = [];

  tradespeopleSnapshot.forEach(doc => {
    const tradesperson = mapToUser(doc.id, doc.data() as Record<string, unknown>);

    const rawServiceAreas = normalize(tradesperson.serviceAreas as string | null | undefined);
    const specialties = (tradesperson.specialties || []).map(s => normalize(s));

    // ---- AREA MATCHING ----
    // 1) Direct string checks (postcode prefix / town / citySlug)
    const tokensToCheck: string[] = [];
    if (jobPostcodePrefix) tokensToCheck.push(jobPostcodePrefix);
    if (jobTown) tokensToCheck.push(jobTown);
    if (jobCitySlug && jobCitySlug !== jobTown) tokensToCheck.push(jobCitySlug);

    let areaMatch = false;
    let areaMatchReason: string | null = null;

    for (const token of tokensToCheck) {
      if (token && rawServiceAreas.includes(token)) {
        areaMatch = true;
        areaMatchReason = `token:${token}`;
        break;
      }
    }

    // 2) London-aware region matching (e.g. "south london", "central london")
    if (!areaMatch && jobLondonRegion) {
      const regionPhrases = [jobLondonRegion, `${jobLondonRegion} london`, `${jobLondonRegion} london area`];

      if (regionPhrases.some(phrase => rawServiceAreas.includes(phrase))) {
        areaMatch = true;
        areaMatchReason = `london-region:${jobLondonRegion}`;
      }
    }

    // ---- SPECIALTY MATCHING ----
    const specialtyMatch = specialties.includes(jobServiceType) || specialties.some(s => jobServiceType.includes(s));

    const tier = asTier(tradesperson.subscriptionTier ?? "basic");

    logger.info("[Job Alerts] Candidate check", {
      tradespersonId: tradesperson.id,
      tier,
      serviceAreas: rawServiceAreas,
      specialties,
      jobPostcodePrefix,
      jobServiceType,
      jobTown,
      jobCitySlug,
      jobLondonRegion,
      areaMatch,
      areaMatchReason,
      specialtyMatch
    });

    if (!areaMatch || !specialtyMatch) {
      return;
    }

    if (tier === "business") {
      businessTier.push(tradesperson);
    } else if (tier === "pro") {
      proTier.push(tradesperson);
    } else {
      basicTier.push(tradesperson);
    }
  });

  logger.info("[Job Alerts] Matching results:", {
    jobId: job.id,
    jobTitle: job.title,
    counts: {
      business: businessTier.length,
      pro: proTier.length,
      basic: basicTier.length,
      total: businessTier.length + proTier.length + basicTier.length
    },
    sample: {
      business: businessTier.slice(0, 3).map(u => u.id),
      pro: proTier.slice(0, 3).map(u => u.id),
      basic: basicTier.slice(0, 3).map(u => u.id)
    }
  });

  return { businessTier, proTier, basicTier };
}

export async function promoteToAdmin(id: string): Promise<User | null> {
  return await updateUser(id, { role: "admin" });
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const adminAuth = getFirebaseAdminAuth();
    await adminAuth.deleteUser(id);

    const usersCollection = UsersCollection();
    await usersCollection.doc(id).delete();
    return true;
  } catch (err) {
    logger.error(`UserService: deleteUser error for ID ${id}:`, err);
    if (typeof err === "object" && err && "code" in err && (err as { code?: string }).code === "auth/user-not-found") {
      try {
        const usersCollection = UsersCollection();
        await usersCollection.doc(id).delete();
        return true;
      } catch (dbErr) {
        logger.error(`UserService: Firestore cleanup failed for user ${id}:`, dbErr);
      }
    }
    return false;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const usersCollection = UsersCollection();
    const doc = await usersCollection.doc(id).get();
    if (!doc.exists) return null;

    console.log("[getUserById] raw Firestore data:", doc.data());
    const mapped = mapToUser(doc.id, doc.data()! as Record<string, unknown>);
    console.log("[getUserById] mapped user.location:", mapped.location);

    return mapped;
  } catch (err) {
    logger.error("UserService: getUserById error:", err);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const usersCollection = UsersCollection();
    const query = await usersCollection.where("email", "==", email).limit(1).get();
    if (query.empty) return null;
    const doc = query.docs[0];

    const mapped = mapToUser(doc.id, doc.data() as Record<string, unknown>);
    return mapped;
  } catch (err) {
    logger.error("UserService: getUserByEmail error:", err);
    return null;
  }
}

// export async function getUserBySlug(slug: string): Promise<User | null> {
//   try {
//     const usersCollection = UsersCollection();
//     const snap = await usersCollection.where("slug", "==", slug).limit(1).get();
//     if (snap.empty) return null;
//     const doc = snap.docs[0];

//     const mapped = mapToUser(doc.id, doc.data() as Record<string, unknown>);
//     return mapped;
//   } catch (err) {
//     logger.error("UserService: getUserBySlug error:", err);
//     return null;
//   }
// }
export async function getUserBySlug(slug: string): Promise<User | null> {
  // 🔹 Defensive guard so we NEVER query Firestore with an invalid value
  const cleanSlug = typeof slug === "string" ? slug.trim() : "";

  if (!cleanSlug || cleanSlug === "undefined") {
    logger.warn("[UserService.getUserBySlug] called with invalid slug", { slug });
    return null;
  }

  try {
    const usersCollection = UsersCollection();
    const snap = await usersCollection.where("slug", "==", cleanSlug).limit(1).get();

    if (snap.empty) return null;

    const doc = snap.docs[0];
    const mapped = mapToUser(doc.id, doc.data() as Record<string, unknown>);
    return mapped;
  } catch (err) {
    logger.error("UserService: getUserBySlug error:", err);
    return null;
  }
}

export async function getPaginatedUsers({
  limit = 6,
  lastVisibleId = null
}: {
  limit?: number;
  lastVisibleId?: string | null;
}): Promise<{
  users: User[];
  lastVisibleId: string | null;
  totalUserCount: number;
}> {
  try {
    const usersCollection = UsersCollection();
    let query = usersCollection.orderBy(FieldPath.documentId()).limit(limit);
    if (lastVisibleId) {
      const lastVisibleDoc = await usersCollection.doc(lastVisibleId).get();
      if (lastVisibleDoc.exists) {
        query = query.startAfter(lastVisibleDoc);
      }
    }

    const [snapshot, countSnap] = await Promise.all([query.get(), usersCollection.count().get()]);

    const users = snapshot.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));
    const nextCursor = snapshot.size === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;

    return {
      users,
      lastVisibleId: nextCursor,
      totalUserCount: countSnap.data().count
    };
  } catch (err) {
    logger.error("UserService: getPaginatedUsers error:", err);
    throw new Error("Failed to fetch paginated users.");
  }
}

export async function getAllUsers(): Promise<User[]> {
  const allUsers: User[] = [];
  let cursor: string | null = null;

  while (true) {
    const { users, lastVisibleId } = await getPaginatedUsers({ limit: 100, lastVisibleId: cursor });
    allUsers.push(...users);
    if (!lastVisibleId) break;
    cursor = lastVisibleId;
  }

  return allUsers;
}

export async function getTotalUserCount(): Promise<number> {
  try {
    const usersCollection = UsersCollection();
    const countSnap = await usersCollection.count().get();
    return countSnap.data().count;
  } catch (err) {
    logger.error("UserService: getTotalUserCount error:", err);
    throw new Error("Failed to get total user count.");
  }
}

export async function verifyUserEmail(email: string): Promise<boolean> {
  try {
    const user = await getUserByEmail(email);
    if (!user) return false;

    const usersCollection = UsersCollection();
    await usersCollection.doc(user.id).update({
      emailVerified: true,
      updatedAt: new Date()
    });

    const adminAuth = getFirebaseAdminAuth();
    await adminAuth.updateUser(user.id, { emailVerified: true });

    return true;
  } catch (err) {
    logger.error("UserService: verifyUserEmail error:", err);
    return false;
  }
}

export async function getUserCountByRole(role: UserRole): Promise<number> {
  try {
    const usersCollection = UsersCollection();
    const countSnap = await usersCollection.where("role", "==", role).count().get();
    return countSnap.data().count;
  } catch (err) {
    logger.error(`UserService: getUserCountByRole for ${role} error:`, err);
    // Return 0 on error instead of throwing to prevent crashing the stats display
    return 0;
  }
}

export async function getVerifiedUserCount(): Promise<number> {
  try {
    const usersCollection = UsersCollection();
    // This assumes emailVerified is set to `true` upon verification
    const countSnap = await usersCollection.where("emailVerified", "==", true).count().get();
    return countSnap.data().count;
  } catch (err) {
    logger.error("UserService: getVerifiedUserCount error:", err);
    return 0;
  }
}
