// src/lib/schemas/job-form-schema.ts
import { z } from "zod";
import { JOB_SERVICE_TYPES, type JobServiceType } from "@/lib/config/locations";

// 🔥 SINGLE SOURCE OF TRUTH
export const serviceTypes = JOB_SERVICE_TYPES;

export const urgencyValues = ["emergency", "urgent", "soon", "flexible"] as const;

export const urgencyOptions = [
  { value: "emergency", label: "Emergency (ASAP)" },
  { value: "urgent", label: "Urgent (This week)" },
  { value: "soon", label: "Soon (Next 2 weeks)" },
  { value: "flexible", label: "Flexible" }
];

export const jobCoreSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters"),
  description: z.string().trim().min(20, "Please provide a more detailed description of the job"),
  urgency: z.enum(urgencyValues),
  // 🔥 Required & tied to JOB_SERVICE_TYPES
  // Note: z.enum() does NOT support `required_error`, so error is handled via UI.
  serviceType: z.enum(serviceTypes),
  photos: z.array(z.string()).max(5).optional()
});

export const jobFormSchema = jobCoreSchema.extend({
  postcode: z.string().trim().min(3, "A valid postcode is required"),
  address: z.string().trim().optional(),
  town: z.string().trim().optional(),

  budget: z
    .string()
    .trim()
    .optional()
    .refine(v => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Budget must be a valid number"),

  preferredDate: z.string().trim().optional()
});

// Extend JobFormValues so TS knows serviceType is JobServiceType
export type JobFormValues = z.infer<typeof jobFormSchema> & {
  serviceType: JobServiceType;
};
