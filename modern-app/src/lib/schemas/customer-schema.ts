import { z } from "zod";

export const customerProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  postcode: z.string().min(1, "Postcode is required"),
  town: z.string().min(1, "Town/City is required"),
  address: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  profilePicture: z.string().optional().nullable()
});
