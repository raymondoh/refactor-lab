// src/app/api/profile/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { userService } from "@/lib/services/user-service";
import { geocodingService } from "@/lib/services/geocoding-service";
import type { UpdateUserData } from "@/lib/types/user";
import { requireSession } from "@/lib/auth/require-session";
import { toSlug } from "@/lib/utils/slugify";
import { logger } from "@/lib/logger";
import { serializeFirestore } from "@/lib/utils/serialize-firestore";

const certificationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  issuingBody: z.string().min(1),
  metadata: z.record(z.string(), z.string().nullable()).optional(),
  fileUrl: z.string().url().nullable().optional(),
  verified: z.boolean().optional(),
  verifiedAt: z.coerce.date().nullable().optional(),
  verifiedBy: z.string().optional()
});

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
  town: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  googleBusinessProfileUrl: z.string().optional().nullable(),
  serviceAreas: z.string().optional().nullable(),
  specialties: z.array(z.string()).optional(),
  experience: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  hourlyRate: z.string().optional().nullable(),
  profilePicture: z.string().optional().nullable(),
  portfolio: z.array(z.string()).optional(),
  certifications: z.array(certificationSchema).optional(),
  notificationSettings: z
    .object({
      newJobAlerts: z.boolean().optional()
    })
    .optional()
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const normalizeString = (value?: string | null) => {
      if (value === undefined || value === null) return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const { postcode, town, address, serviceAreas, specialties, ...restOfData } = validatedData;

    const location =
      postcode !== undefined || town !== undefined || address !== undefined
        ? {
            postcode: normalizeString(postcode ?? null),
            town: normalizeString(town ?? null),
            address: normalizeString(address ?? null),
            latitude: null,
            longitude: null
          }
        : undefined;

    const updateData: UpdateUserData & {
      citySlug?: string;
      serviceAreaSlugs?: string[];
      serviceSlugs?: string[];
      searchKeywords?: string[];
    } = {
      ...restOfData,
      name: `${validatedData.firstName} ${validatedData.lastName}`,
      onboardingComplete: true,
      serviceAreas: normalizeString(serviceAreas),
      specialties: specialties,
      ...(location ? { location } : {})
    };

    // --- KEYWORD & SLUG GENERATION ---
    const keywords = new Set<string>();

    if (validatedData.firstName) keywords.add(validatedData.firstName.toLowerCase());
    if (validatedData.lastName) keywords.add(validatedData.lastName.toLowerCase());
    if (validatedData.businessName) {
      validatedData.businessName
        .toLowerCase()
        .split(/\s+/)
        .forEach(word => keywords.add(word));
    }
    if (town) {
      keywords.add(town.toLowerCase());
      updateData.citySlug = toSlug(town);
    }
    if (serviceAreas) {
      const slugs = serviceAreas.split(",").map(area => toSlug(area.trim()));
      updateData.serviceAreaSlugs = slugs;
      slugs.forEach(slug => keywords.add(slug));
    }
    if (specialties) {
      const slugs = specialties.map(specialty => toSlug(specialty));
      updateData.serviceSlugs = slugs;
      specialties.forEach(specialty => {
        specialty
          .toLowerCase()
          .split(/\s+/)
          .forEach(word => {
            const cleanWord = word.replace(/[()&,]/g, "");
            if (cleanWord) keywords.add(cleanWord);
          });
      });
    }

    updateData.searchKeywords = Array.from(keywords);
    // --- END OF GENERATION ---

    if (postcode && updateData.location) {
      const geoResult = await geocodingService.getCoordinatesFromPostcode(postcode);
      if (geoResult) {
        updateData.location.latitude = geoResult.coordinates.latitude;
        updateData.location.longitude = geoResult.coordinates.longitude;
      }
    }

    const updatedUser = await userService.updateUser(session.user.id, updateData);
    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    const safeUser = serializeFirestore(updatedUser);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      user: safeUser
    });
  } catch (err: unknown) {
    logger.error("[API /api/profile] Profile update error", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
