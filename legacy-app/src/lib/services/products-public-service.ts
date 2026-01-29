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

function sanitizeProduct<T>(product: T): T {
  // Ensures Next can pass it to Client Components (no Firestore Timestamp objects)
  return toPlain(product);
}

// ✅ converts Firebase/Admin timestamps (and {_seconds,_nanoseconds}) to ISO strings
function toPlain(value: unknown): any {
  if (value instanceof Timestamp) return value.toDate().toISOString();

  if (
    value &&
    typeof value === "object" &&
    "_seconds" in (value as any) &&
    "_nanoseconds" in (value as any) &&
    typeof (value as any)._seconds === "number" &&
    typeof (value as any)._nanoseconds === "number"
  ) {
    const ms = (value as any)._seconds * 1000 + Math.floor((value as any)._nanoseconds / 1_000_000);
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
    let products = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    console.log(
      "[products-public] sample categories:",
      products.slice(0, 10).map(p => p.category)
    );
    console.log(
      "[products-public] sample subcategories:",
      products.slice(0, 10).map(p => p.subcategory)
    );

    // ✅ If Firestore query returns nothing, fallback to in-memory matching against SLUGS
    // This fixes "cars" vs "Cars" / "dirt-bikes" vs "Dirt Bikes" mismatches.
    if (products.length === 0 && (input.category || input.subcategory)) {
      const fallbackSnap = await db.collection("products").orderBy("createdAt", "desc").limit(500).get();
      products = fallbackSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

      const wantedCategorySlug = input.category ? slugify(input.category) : undefined;
      const wantedSubcategorySlug = input.subcategory ? slugify(input.subcategory) : undefined;

      products = products.filter(p => {
        const catOk = wantedCategorySlug ? slugify(p.category) === wantedCategorySlug : true;
        const subOk = wantedSubcategorySlug ? slugify(p.subcategory) === wantedSubcategorySlug : true;
        return catOk && subOk;
      });
    }

    // query text (in-memory)
    if (input.query) {
      const lower = input.query.toLowerCase();
      products = products.filter(p => {
        const name = String(p.name ?? "")
          .toLowerCase()
          .includes(lower);
        const desc = String(p.description ?? "")
          .toLowerCase()
          .includes(lower);
        const tags =
          Array.isArray(p.tags) &&
          p.tags.some((t: any) =>
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
        const price = Number(p.price ?? 0);
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

    const product = sanitizeProduct({ id: doc.id, ...(doc.data() as any) });

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
