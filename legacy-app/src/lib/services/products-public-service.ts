"use server";

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { Timestamp } from "firebase-admin/firestore";
import { normalizeCategory, normalizeSubcategory } from "@/config/categories";

type GetAllProductsInput = {
  category?: string;
  subcategory?: string;
  query?: string;
  designThemes?: string[];
  onSale?: boolean;
  isCustomizable?: boolean;

  isFeatured?: boolean;
  isNewArrival?: boolean;
  themedOnly?: boolean;

  limit?: number;

  priceRange?: string; // "min-max"
  material?: string | string[];
  baseColor?: string | string[];
};

type SecondsNanos = { _seconds: number; _nanoseconds: number };

function isSecondsNanos(value: unknown): value is SecondsNanos {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v._seconds === "number" && typeof v._nanoseconds === "number";
}

// ✅ converts Firebase/Admin timestamps (and {_seconds,_nanoseconds}) to ISO strings
function toPlain(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();

  if (isSecondsNanos(value)) {
    const ms = value._seconds * 1000 + Math.floor(value._nanoseconds / 1_000_000);
    return new Date(ms).toISOString();
  }

  if (Array.isArray(value)) return value.map(v => toPlain(v));

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = toPlain(v);
    return out;
  }

  return value;
}

function sanitizeProduct(value: unknown): unknown {
  // Ensures Next can pass it to Client Components (no Firestore Timestamp objects)
  return toPlain(value);
}

function slugify(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toStringArray(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v.filter(Boolean) : [v].filter(Boolean);
}

function getStringField(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === "string" ? v : "";
}

function getNumberField(obj: Record<string, unknown>, key: string, fallback = 0): number {
  const v = obj[key];
  return typeof v === "number" ? v : fallback;
}

export async function getAllProductsPublic(input: GetAllProductsInput) {
  try {
    const db = getAdminFirestore();

    const limit = typeof input.limit === "number" && input.limit > 0 ? Math.min(input.limit, 200) : 50;

    // ✅ Normalize category/subcategory to canonical labels when possible
    const normalizedCategory = input.category ? normalizeCategory(input.category) : undefined;

    // normalizeSubcategory expects a Category union, so only call it with normalizedCategory
    const normalizedSubcategory =
      input.subcategory && normalizedCategory ? normalizeSubcategory(input.subcategory, normalizedCategory) : undefined;

    // We'll try Firestore query first
    let q: FirebaseFirestore.Query = db.collection("products").orderBy("createdAt", "desc").limit(limit);

    const categoryToUse = normalizedCategory ?? input.category;
    const subcategoryToUse = normalizedSubcategory ?? input.subcategory;

    if (categoryToUse) q = q.where("category", "==", categoryToUse);
    if (subcategoryToUse) q = q.where("subcategory", "==", subcategoryToUse);

    if (input.onSale !== undefined) q = q.where("onSale", "==", input.onSale);
    if (input.isCustomizable !== undefined) q = q.where("isCustomizable", "==", input.isCustomizable);

    // Array fields
    if (input.designThemes?.length) q = q.where("designThemes", "array-contains-any", input.designThemes.slice(0, 10));

    // "in" filters (max 10)
    const materials = toStringArray(input.material);
    if (materials?.length) q = q.where("material", "in", materials.slice(0, 10));

    const colors = toStringArray(input.baseColor);
    if (colors?.length) q = q.where("baseColor", "in", colors.slice(0, 10));

    // priceRange (Firestore range filters can require indexes)
    // We'll do this in-memory to avoid index pain.
    const priceRange = input.priceRange;

    const snap = await q.get();

    // ✅ no explicit any
    let products = snap.docs.map(d => ({ id: d.id, ...(d.data() ?? {}) })) as Array<
      Record<string, unknown> & { id: string }
    >;

    console.log(
      "[products-public] sample categories:",
      products.slice(0, 10).map(p => getStringField(p, "category"))
    );
    console.log(
      "[products-public] sample subcategories:",
      products.slice(0, 10).map(p => getStringField(p, "subcategory"))
    );

    // ✅ If Firestore query returns nothing, fallback to in-memory matching against SLUGS
    // This fixes "cars" vs "Cars" / "dirt-bikes" vs "Dirt Bikes" mismatches.
    if (products.length === 0 && (input.category || input.subcategory)) {
      const fallbackSnap = await db.collection("products").orderBy("createdAt", "desc").limit(500).get();

      // ✅ no explicit any
      products = fallbackSnap.docs.map(d => ({ id: d.id, ...(d.data() ?? {}) })) as Array<
        Record<string, unknown> & { id: string }
      >;

      const wantedCategorySlug = input.category ? slugify(input.category) : undefined;
      const wantedSubcategorySlug = input.subcategory ? slugify(input.subcategory) : undefined;

      products = products.filter(p => {
        const catOk = wantedCategorySlug ? slugify(getStringField(p, "category")) === wantedCategorySlug : true;
        const subOk = wantedSubcategorySlug
          ? slugify(getStringField(p, "subcategory")) === wantedSubcategorySlug
          : true;
        return catOk && subOk;
      });
    }

    // query text (in-memory)
    if (input.query) {
      const lower = input.query.toLowerCase();

      products = products.filter(p => {
        const name = getStringField(p, "name").toLowerCase().includes(lower);
        const desc = getStringField(p, "description").toLowerCase().includes(lower);

        const tagsRaw = p["tags"];
        const tags =
          Array.isArray(tagsRaw) &&
          (tagsRaw as unknown[]).some(t =>
            String(t ?? "")
              .toLowerCase()
              .includes(lower)
          );

        return name || desc || tags;
      });
    }

    // priceRange (in-memory)
    if (priceRange) {
      const [minS, maxS] = priceRange.split("-");
      const min = Number.parseFloat(minS);
      const max = Number.parseFloat(maxS);

      products = products.filter(p => {
        const price = getNumberField(p, "price", 0);
        if (!Number.isFinite(price)) return false;
        if (Number.isFinite(min) && price < min) return false;
        if (Number.isFinite(max) && price > max) return false;
        return true;
      });
    }

    return { success: true as const, data: products.slice(0, limit).map(p => toPlain(p)) };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching products";

    return { success: false as const, error: message };
  }
}

export async function getProductByIdPublic(id: string) {
  try {
    if (!id) return { success: false as const, error: "Product ID is required", status: 400 as const };

    const db = getAdminFirestore();
    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) return { success: false as const, error: "Product not found", status: 404 as const };

    // ✅ no as any
    const product = sanitizeProduct({ id: doc.id, ...(doc.data() ?? {}) });

    return { success: true as const, data: { product } };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error fetching product";

    return { success: false as const, error: message, status: 500 as const };
  }
}
