// src/lib/services/geocoding-service.ts
import { logger } from "@/lib/logger";

// Geocoding service for converting postcodes (full or outcode) to coordinates via postcodes.io
interface PostcodesIOResult {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district: string;
  admin_ward: string;
  country: string;
  outcode?: string; // For outcode responses
  lat?: number; // For outcode responses
  lng?: number; // For outcode responses
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PostcodeResult {
  postcode: string; // full postcode or outcode (e.g., "E7")
  coordinates: Coordinates;
  district: string;
  ward: string;
  country: string;
}

interface CacheEntry {
  result: PostcodeResult;
  expiresAt: number;
}

class GeocodingService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  /**
   * Normalise input (strip spaces, uppercase).
   */
  private normalise(postcodeOrOutcode: string): string {
    return (postcodeOrOutcode || "").replace(/\s+/g, "").toUpperCase();
  }

  /**
   * Try to fetch a full postcode result.
   */
  private async fetchFullPostcode(cleanPostcode: string) {
    const res = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status === 200 && data.result) return data.result as PostcodesIOResult;
    return null;
  }

  /**
   * Try to fetch an outcode result (e.g., E7, W11).
   */
  private async fetchOutcode(cleanOutcode: string) {
    const res = await fetch(`https://api.postcodes.io/outcodes/${cleanOutcode}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status === 200 && data.result) return data.result as PostcodesIOResult;
    return null;
  }

  /**
   * Using postcodes.io - free UK postcode API.
   * Accepts either a full postcode (e.g. "E7 9JH") or an outcode (e.g. "E7").
   * Falls back to outcodes when the full postcode lookup fails.
   */
  async getCoordinatesFromPostcode(postcodeOrOutcode: string): Promise<PostcodeResult | null> {
    try {
      const clean = this.normalise(postcodeOrOutcode);

      // Cache first
      const cached = this.cache.get(clean);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.result;
      }
      if (cached) {
        this.cache.delete(clean);
      }

      // 1) Try full postcode endpoint
      const full = await this.fetchFullPostcode(clean);
      if (full) {
        const result: PostcodeResult = {
          postcode: full.postcode, // full, formatted
          coordinates: { latitude: full.latitude, longitude: full.longitude },
          district: full.admin_district ?? "Unknown",
          ward: full.admin_ward ?? "Unknown",
          country: full.country ?? "UK"
        };
        this.cache.set(clean, { result, expiresAt: Date.now() + this.CACHE_DURATION });
        return result;
      }

      // 2) Fallback to outcodes endpoint (handles inputs like "E7")
      const out = await this.fetchOutcode(clean);
      if (out) {
        const result: PostcodeResult = {
          postcode: out.outcode ?? clean,
          coordinates: {
            latitude: out.latitude ?? out.lat,
            longitude: out.longitude ?? out.lng
          },
          district: out.admin_district ?? "Unknown",
          ward: out.admin_ward ?? "Unknown",
          country: out.country ?? "UK"
        };
        this.cache.set(clean, { result, expiresAt: Date.now() + this.CACHE_DURATION });
        return result;
      }

      // Neither endpoint succeeded
      logger.warn(`[Geocoding] Lookup failed for "${postcodeOrOutcode}" (both full and outcode).`);
      return null;
    } catch (error) {
      logger.error("[Geocoding] Error:", error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula (miles).
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 3959; // miles
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Round to 1 decimal place
    return Math.round(distance * 10) / 10;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Batch geocode multiple postcodes/outcodes.
   * Uses simple throttling to be nice to the free API.
   */
  async batchGeocode(postcodes: string[]): Promise<Map<string, PostcodeResult>> {
    const results = new Map<string, PostcodeResult>();

    const batchSize = 10;
    for (let i = 0; i < postcodes.length; i += batchSize) {
      const batch = postcodes.slice(i, i + batchSize);
      const promises = batch.map(async raw => {
        const result = await this.getCoordinatesFromPostcode(raw);
        if (result) {
          results.set(raw, result);
        }
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await Promise.all(promises);
    }

    return results;
  }
}

export const geocodingService = new GeocodingService();
