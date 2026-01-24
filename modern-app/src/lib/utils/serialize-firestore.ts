// src/lib/utils/serialize-firestore.ts
import type { Timestamp as ClientTimestamp, GeoPoint as ClientGeoPoint } from "firebase/firestore";
import type { Timestamp as AdminTimestamp, GeoPoint as AdminGeoPoint } from "firebase-admin/firestore";

// Support both client & admin SDK Timestamp types
type AnyTimestamp = ClientTimestamp | AdminTimestamp;
type AnyGeoPoint = ClientGeoPoint | AdminGeoPoint;

function isTimestamp(value: unknown): value is AnyTimestamp {
  if (!value || typeof value !== "object") return false;

  const maybeTimestamp = value as { toDate?: unknown };

  return typeof maybeTimestamp.toDate === "function";
}

function isGeoPoint(value: unknown): value is AnyGeoPoint {
  if (!value || typeof value !== "object") return false;

  const maybeGeoPoint = value as { latitude?: unknown; longitude?: unknown };

  return typeof maybeGeoPoint.latitude === "number" && typeof maybeGeoPoint.longitude === "number";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function _serialize(value: unknown): unknown {
  if (value == null) return value;

  // Arrays: recurse
  if (Array.isArray(value)) {
    return value.map(_serialize);
  }

  // Firestore Timestamp -> ISO string
  if (isTimestamp(value)) {
    try {
      return value.toDate().toISOString();
    } catch {
      return value;
    }
  }

  // JS Date -> ISO string (just in case)
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Firestore GeoPoint -> simple object
  if (isGeoPoint(value)) {
    return {
      latitude: value.latitude,
      longitude: value.longitude
    };
  }

  // Plain objects: deep-serialize
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = _serialize(val);
    }
    return out;
  }

  // Everything else (string, number, boolean, etc.)
  return value;
}

/**
 * Deeply serialize Firestore data so it is safe to send to
 * Client Components / JSON (no Timestamps, GeoPoints, etc.).
 */
export function serializeFirestore<T>(input: T): T {
  return _serialize(input) as T;
}
