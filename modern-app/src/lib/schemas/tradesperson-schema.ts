import { z } from "zod";
import { JOB_SERVICE_TYPES } from "@/lib/config/locations";

export const tradespersonProfileSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(1, "Contact phone is required"),
    town: z.string().min(1, "Town/City is required"),
    postcode: z.string().min(1, "Postcode is required"),
    address: z.string().optional(),
    businessName: z.string().optional(),
    googleBusinessProfileUrl: z.string().optional(),
    serviceAreas: z.string().min(3, "Service areas are required"),
    // FIXED: Changed errorMap to message to match the expected Zod overload
    serviceType: z.enum(JOB_SERVICE_TYPES, {
      message: "Please select a primary service type"
    }),
    specialties: z.array(z.string()).min(1, "Please select at least one specialty."),
    otherSpecialty: z.string().optional(),
    experience: z.string().min(1, "Please select your years of experience."),
    description: z.string().optional(),
    hourlyRate: z.string().optional(),
    profilePicture: z.string().optional(),
    portfolio: z.array(z.string()).optional(),
    notificationSettings: z
      .object({
        newJobAlerts: z.boolean()
      })
      .optional()
  })
  .refine(
    data => {
      if (data.specialties.includes("Other") && !data.otherSpecialty?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: "Please specify your other specialty",
      path: ["otherSpecialty"]
    }
  );
