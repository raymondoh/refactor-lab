// src/schemas/user/index.ts
import { z } from "zod";

// Profile update schema
export const profileUpdateSchema = z.object({
  // Highlight: Renamed 'name' to 'displayName' and made it optional
  displayName: z.string().min(1, "Display Name is required").optional(), // Optional, as first/last name will be primary
  // Highlight: Added new 'firstName' and 'lastName' fields
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  bio: z.string().optional()
  // We don't validate photo here since it's a File object
  // and will be handled separately
});

// Types derived from the schemas
export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
