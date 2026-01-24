// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { algoliasearch } from "algoliasearch";

admin.initializeApp();

// We keep types loose here to avoid fighting the algoliasearch typings in Functions.
type AlgoliaClient = ReturnType<typeof algoliasearch>;

let algoliaClient: AlgoliaClient | null = null;

// -----------------------------------------------------------------------------
// Algolia config (env + functions.config)
// -----------------------------------------------------------------------------

// Prefer functions.config().algolia.*, but fall back to process.env so we don't break
const ALGOLIA_APP_ID = (functions.config().algolia && functions.config().algolia.app_id) || process.env.ALGOLIA_APPID;

const ALGOLIA_ADMIN_KEY =
  (functions.config().algolia && functions.config().algolia.admin_key) ||
  process.env.ALGOLIA_ADMIN_API_KEY ||
  process.env.ALGOLIA_ADMINKEY;

// Index names: prefer per-project functions config, then fall back to multiple env
// names so this works across old/new setups, then sensible defaults.
const JOBS_INDEX_NAME =
  (functions.config().algolia && functions.config().algolia.jobs_index) ||
  process.env.ALGOLIA_INDEX_JOBS ||
  process.env.ALGOLIA_JOBS_INDEX ||
  process.env.NEXT_PUBLIC_ALGOLIA_INDEX_JOBS ||
  "jobs";

const PLUMBERS_INDEX_NAME =
  (functions.config().algolia && functions.config().algolia.users_index) ||
  process.env.ALGOLIA_INDEX_USERS ||
  process.env.ALGOLIA_USERS_INDEX ||
  process.env.NEXT_PUBLIC_ALGOLIA_INDEX_USERS ||
  "plumbers";

const initializeAlgolia = (): AlgoliaClient => {
  if (algoliaClient) return algoliaClient;

  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    functions.logger.error(
      "Missing Algolia configuration (algolia.app_id, algolia.admin_key or ALGOLIA_APPID / ALGOLIA_ADMIN_API_KEY / ALGOLIA_ADMINKEY)"
    );
    throw new Error("Algolia configuration is not set.");
  }

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
  algoliaClient = client;
  return client;
};

const getAlgoliaClient = (): AlgoliaClient => {
  const client = initializeAlgolia();
  if (!client) throw new Error("Algolia client failed to initialize");
  return client;
};

// 🚀 v5 admin API: no initIndex – use client.saveObject/deleteObject
const saveToIndex = async (indexName: string, body: Record<string, any>) => {
  const client = getAlgoliaClient();
  // `body` must already contain objectID
  return client.saveObject({ indexName, body });
};

const deleteFromIndex = async (indexName: string, objectID: string) => {
  const client = getAlgoliaClient();
  return client.deleteObject({ indexName, objectID });
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const SERVICE_ROLES = ["tradesperson", "business_owner", "admin"] as const;

const canAccess = (role: string | null | undefined, allowed: readonly string[]) => {
  if (!role) return false;
  if (role === "admin") return true;
  return allowed.includes(role);
};

const isServiceProvider = (role: string | null | undefined): boolean => canAccess(role, SERVICE_ROLES);

const convertValueForAlgolia = (value: any): any => {
  if (value instanceof admin.firestore.Timestamp) return value.toMillis();
  if (value instanceof admin.firestore.GeoPoint) {
    return { latitude: value.latitude, longitude: value.longitude };
  }
  if (Array.isArray(value)) return value.map(convertValueForAlgolia);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convertValueForAlgolia(v)]));
  }
  return value;
};

const formatDataForAlgolia = (doc: admin.firestore.DocumentSnapshot): Record<string, any> => {
  const data = doc.data();
  if (!data) throw new Error("Document data is empty");
  const formatted: Record<string, any> = { objectID: doc.id };
  for (const [key, value] of Object.entries(data)) {
    formatted[key] = convertValueForAlgolia(value);
  }
  return formatted;
};

const toSlug = (s?: string) =>
  (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Geocoding helpers (postcodes.io)
async function fetchFullPostcode(clean: string) {
  const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  return data?.status === 200 ? data.result : null;
}

async function fetchOutcode(clean: string) {
  const res = await fetch(`https://api.postcodes.io/outcodes/${clean}`);
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  return data?.status === 200 ? data.result : null;
}

async function geocodeWithFallback(
  postcode: string
): Promise<{ lat: number; lng: number; admin_district?: string; admin_county?: string } | null> {
  try {
    const clean = (postcode || "").replace(/\s+/g, "").toUpperCase();
    const full = await fetchFullPostcode(clean);
    if (full) {
      return {
        lat: full.latitude,
        lng: full.longitude,
        admin_district: full.admin_district,
        admin_county: full.admin_county
      };
    }
    const out = await fetchOutcode(clean);
    if (out) {
      return { lat: out.latitude ?? out.lat, lng: out.longitude ?? out.lng };
    }
    functions.logger.warn(`Geocode failed for "${postcode}" (full & outcode).`);
    return null;
  } catch (err) {
    functions.logger.error("Geocoding error:", err);
    return null;
  }
}

async function resolveCitySlug(
  base: Record<string, any>,
  geocode?: { admin_district?: string; admin_county?: string }
): Promise<string | undefined> {
  const fromHyphen = base["city-slug"];
  if (!base.citySlug && typeof fromHyphen === "string" && fromHyphen.trim()) {
    return toSlug(fromHyphen);
  }
  if (typeof base.citySlug === "string" && base.citySlug.trim()) {
    return toSlug(base.citySlug);
  }
  const town = base?.location?.town as string | undefined;
  const city = base?.location?.city as string | undefined;
  const name = town?.trim() || city?.trim();
  if (name) return toSlug(name);

  try {
    const customerId = base.customerId as string | undefined;
    if (customerId) {
      const userSnap = await admin.firestore().doc(`users/${customerId}`).get();
      if (userSnap.exists) {
        const u = userSnap.data() || {};
        const uCitySlug = (u.citySlug || u["city-slug"]) as string | undefined;
        if (uCitySlug?.trim()) return toSlug(uCitySlug);
        const uTown = (u.location?.town || u.location?.city) as string | undefined;
        if (uTown?.trim()) return toSlug(uTown);
      }
    }
  } catch (e) {
    functions.logger.warn("resolveCitySlug: user profile read failed", e);
  }

  if (geocode?.admin_district || geocode?.admin_county) {
    return toSlug(geocode.admin_district || geocode.admin_county);
  }
  return undefined;
}

/**
 * Build the final Job record for Algolia.
 */
async function buildJobAlgoliaRecord(doc: admin.firestore.DocumentSnapshot): Promise<Record<string, any>> {
  const base = formatDataForAlgolia(doc);

  // specialties: union with serviceType; accept legacy "specialities"
  {
    const specs = Array.isArray(base.specialties) ? base.specialties : [];
    const legacy = Array.isArray(base.specialities) ? base.specialities : [];
    const svc = typeof base.serviceType === "string" ? base.serviceType.trim() : "";
    base.specialties = Array.from(
      new Set([...specs, ...legacy, svc].map(s => (typeof s === "string" ? s.trim() : "")).filter(Boolean))
    );
    if (base.specialities) delete base.specialities;
  }

  // _geoloc: prefer stored coords; else geocode postcode
  const loc = base.location ?? {};
  const toNum = (v: any) => (v === 0 || v === "0" ? 0 : typeof v === "string" ? Number(v) : v);

  let lat: number | undefined = Number.isFinite(toNum(loc.latitude))
    ? Number(toNum(loc.latitude))
    : Number.isFinite(toNum(loc.lat))
      ? Number(toNum(loc.lat))
      : undefined;

  let lng: number | undefined = Number.isFinite(toNum(loc.longitude))
    ? Number(toNum(loc.longitude))
    : Number.isFinite(toNum(loc.lng))
      ? Number(toNum(loc.lng))
      : undefined;

  let geoMeta: { lat: number; lng: number; admin_district?: string; admin_county?: string } | undefined;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const postcode = typeof loc.postcode === "string" ? loc.postcode.trim() : "";
    if (postcode) {
      const geo = await geocodeWithFallback(postcode);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        geoMeta = geo;
      }
    }
  }

  if (typeof lat === "number" && typeof lng === "number") {
    base._geoloc = { lat, lng };
  } else if (base._geoloc) {
    delete base._geoloc;
  }

  // citySlug
  if (!base.citySlug && typeof loc.town === "string" && loc.town.trim()) {
    base.citySlug = toSlug(loc.town);
  }
  const resolvedCity = await resolveCitySlug(base, geoMeta);
  if (resolvedCity) base.citySlug = resolvedCity;

  // numeric guards
  if (typeof base.quoteCount !== "number") {
    base.quoteCount = Number(base.quoteCount ?? 0);
  }
  if (base.budget != null && typeof base.budget !== "number") {
    base.budget = Number(base.budget);
  }

  // createdAtTimestamp
  if (typeof base.createdAt === "number") {
    base.createdAtTimestamp = Math.floor(base.createdAt);
  } else if (typeof base.createdAt === "string") {
    const ts = Date.parse(base.createdAt);
    if (!Number.isNaN(ts)) base.createdAtTimestamp = ts;
  }

  return base;
}

// -----------------------------------------------------------------------------
// Job Sync Functions
// -----------------------------------------------------------------------------

export const onJobWritten = functions
  .region("europe-west2")
  .firestore.document("jobs/{jobId}")
  .onWrite(async change => {
    if (!change.after.exists) return;

    try {
      const record = await buildJobAlgoliaRecord(change.after);
      await saveToIndex(JOBS_INDEX_NAME, record);
      functions.logger.info(`Algolia: job indexed`, {
        id: change.after.id,
        has_geoloc: !!record._geoloc,
        citySlug: record.citySlug ?? null,
        index: JOBS_INDEX_NAME
      });
    } catch (error) {
      functions.logger.error(`Algolia: job index error for ${change.after.id}`, error as any);
    }
  });

export const onJobDeleted = functions
  .region("europe-west2")
  .firestore.document("jobs/{jobId}")
  .onDelete(async snap => {
    try {
      await deleteFromIndex(JOBS_INDEX_NAME, snap.id);
      functions.logger.info(`Algolia: job deleted`, {
        id: snap.id,
        index: JOBS_INDEX_NAME
      });
    } catch (error) {
      functions.logger.error(`Algolia: job delete error for ${snap.id}`, error as any);
    }
  });

// -----------------------------------------------------------------------------
// User Sync Functions (unchanged except concise logs)
// -----------------------------------------------------------------------------

const PUBLIC_USER_FIELDS = [
  "name",
  "firstName",
  "lastName",
  "businessName",
  "slug",
  "location",
  "serviceAreas",
  "specialties",
  "experience",
  "description",
  "profilePicture",
  "avgRating",
  "reviewsCount",
  "isFeatured",
  "citySlug",
  "serviceAreaSlugs",
  "serviceSlugs",
  "searchKeywords",
  "role"
] as const;

const buildPublicUserRecord = (docId: string, data: admin.firestore.DocumentData): Record<string, any> => {
  const record: Record<string, any> = { objectID: docId };
  for (const field of PUBLIC_USER_FIELDS) {
    if (data[field] !== undefined) {
      record[field] = convertValueForAlgolia(data[field]);
    }
  }
  return record;
};

export const onUserCreate = functions
  .region("europe-west2")
  .firestore.document("users/{userId}")
  .onCreate(async snap => {
    const data = snap.data();
    if (!data || !isServiceProvider(data.role)) return;
    try {
      await saveToIndex(PLUMBERS_INDEX_NAME, buildPublicUserRecord(snap.id, data));
      functions.logger.info("Algolia: plumber created", {
        id: snap.id,
        index: PLUMBERS_INDEX_NAME
      });
    } catch (error) {
      functions.logger.error(`Algolia: plumber create error for ${snap.id}`, error as any);
    }
  });

export const onUserUpdate = functions
  .region("europe-west2")
  .firestore.document("users/{userId}")
  .onUpdate(async change => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!afterData) return;

    try {
      const wasService = isServiceProvider(beforeData?.role);
      const isService = isServiceProvider(afterData?.role);

      if (isService) {
        await saveToIndex(PLUMBERS_INDEX_NAME, buildPublicUserRecord(change.after.id, afterData));
        functions.logger.info("Algolia: plumber updated", {
          id: change.after.id,
          index: PLUMBERS_INDEX_NAME
        });
      } else if (wasService && !isService) {
        await deleteFromIndex(PLUMBERS_INDEX_NAME, change.after.id);
        functions.logger.info("Algolia: plumber removed", {
          id: change.after.id,
          index: PLUMBERS_INDEX_NAME
        });
      }
    } catch (error) {
      functions.logger.error(`Algolia: plumber update error for ${change.after.id}`, error as any);
    }
  });

export const onUserDeleted = functions
  .region("europe-west2")
  .firestore.document("users/{userId}")
  .onDelete(async snap => {
    try {
      await deleteFromIndex(PLUMBERS_INDEX_NAME, snap.id);
      functions.logger.info("Algolia: user deleted", {
        id: snap.id,
        index: PLUMBERS_INDEX_NAME
      });
    } catch (error) {
      functions.logger.error(`Algolia: user delete error for ${snap.id}`, error as any);
    }
  });

// Sanitize job specialties on every write
export const onJobSanitize = functions
  .region("europe-west2")
  .firestore.document("jobs/{jobId}")
  .onWrite(async change => {
    if (!change.after.exists) return;
    const snap = change.after;
    const data = snap.data() || {};
    const serviceType = typeof data.serviceType === "string" ? data.serviceType.trim() : "";
    const specialtiesRaw = Array.isArray(data.specialties) ? data.specialties : [];
    const normalized = Array.from(
      new Set([...specialtiesRaw.map(s => (typeof s === "string" ? s.trim() : "")), serviceType].filter(Boolean))
    );
    const same = specialtiesRaw.length === normalized.length && normalized.every((s, i) => s === specialtiesRaw[i]);

    if (!same) {
      await snap.ref.update({ specialties: normalized });
      functions.logger.info("Sanitize: specialties updated", { id: snap.id });
    }
  });
