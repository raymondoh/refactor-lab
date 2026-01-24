// src/lib/utils/location.ts
/**
 * Location utilities for postcode validation and distance calculations
 */

export interface PostcodeInfo {
  postcode: string;
  area: string;
  district: string;
  sector: string;
  unit: string;
  isValid: boolean;
}

export class LocationUtils {
  /**
   * Validate UK postcode format
   */
  static validatePostcode(postcode: string): boolean {
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcode.replace(/\s/g, ""));
  }

  /**
   * Parse postcode into components
   */
  static parsePostcode(postcode: string): PostcodeInfo {
    const cleaned = postcode.replace(/\s/g, "").toUpperCase();
    const isValid = this.validatePostcode(cleaned);

    if (!isValid) {
      return {
        postcode: cleaned,
        area: "",
        district: "",
        sector: "",
        unit: "",
        isValid: false
      };
    }

    // Extract components (simplified)
    const match = cleaned.match(/^([A-Z]{1,2})([0-9])([A-Z0-9]?)([0-9])([A-Z]{2})$/);

    if (!match) {
      return {
        postcode: cleaned,
        area: "",
        district: "",
        sector: "",
        unit: "",
        isValid: false
      };
    }

    const [, area, district1, district2, sector, unit] = match;
    const district = district1 + (district2 || "");

    return {
      postcode: cleaned,
      area,
      district: area + district,
      sector: area + district + sector,
      unit: area + district + sector + unit,
      isValid: true
    };
  }

  /**
   * Check if two postcodes are in the same area/district
   */
  static arePostcodesNearby(
    postcode1: string,
    postcode2: string,
    level: "area" | "district" | "sector" = "district"
  ): boolean {
    const parsed1 = this.parsePostcode(postcode1);
    const parsed2 = this.parsePostcode(postcode2);

    if (!parsed1.isValid || !parsed2.isValid) return false;

    switch (level) {
      case "area":
        return parsed1.area === parsed2.area;
      case "district":
        return parsed1.district === parsed2.district;
      case "sector":
        return parsed1.sector === parsed2.sector;
      default:
        return false;
    }
  }

  /**
   * Get postcode suggestions based on partial input
   */
  static getPostcodeSuggestions(partial: string, existingPostcodes: string[]): string[] {
    if (!partial || partial.length < 2) return [];

    const partialUpper = partial.toUpperCase().replace(/\s/g, "");

    return existingPostcodes
      .filter(postcode => {
        const cleanPostcode = postcode.replace(/\s/g, "").toUpperCase();
        return cleanPostcode.startsWith(partialUpper);
      })
      .slice(0, 10);
  }

  /**
   * Format postcode for display
   */
  static formatPostcode(postcode: string): string {
    const cleaned = postcode.replace(/\s/g, "").toUpperCase();

    if (cleaned.length <= 4) return cleaned;

    // Insert space before last 3 characters
    return cleaned.slice(0, -3) + " " + cleaned.slice(-3);
  }

  /**
   * Simple distance approximation based on postcode similarity
   * Note: This is a simplified approach. For production, you'd want to use
   * actual coordinates and proper distance calculations
   */
  static estimateDistance(postcode1: string, postcode2: string): number {
    const parsed1 = this.parsePostcode(postcode1);
    const parsed2 = this.parsePostcode(postcode2);

    if (!parsed1.isValid || !parsed2.isValid) return 999;

    // Same postcode
    if (parsed1.postcode === parsed2.postcode) return 0;

    // Same sector (very close)
    if (parsed1.sector === parsed2.sector) return Math.random() * 2;

    // Same district (nearby)
    if (parsed1.district === parsed2.district) return 2 + Math.random() * 8;

    // Same area (same city/region)
    if (parsed1.area === parsed2.area) return 10 + Math.random() * 20;

    // Different areas (far)
    return 30 + Math.random() * 100;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}
