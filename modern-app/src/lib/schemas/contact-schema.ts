// src/lib/schemas/contact-schema.ts
import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    // --- REMOVE THIS ARGUMENT ---
    // .string({ required_error: "Name is required." })
    .string() // <-- Keep just .string()
    .min(2, {
      message: "Name must be at least 2 characters."
    })
    .max(100, {
      message: "Name must be 100 characters or less."
    }),
  email: z
    // --- REMOVE THIS ARGUMENT ---
    // .string({ required_error: "Email is required." })
    .string() // <-- Keep just .string()
    .email({
      message: "Please enter a valid email address."
    }),
  subject: z
    // --- REMOVE THIS ARGUMENT ---
    // .string({ required_error: "Subject is required." })
    .string() // <-- Keep just .string()
    .min(5, {
      message: "Subject must be at least 5 characters."
    })
    .max(150, {
      message: "Subject must be 150 characters or less."
    }),
  message: z
    // --- REMOVE THIS ARGUMENT ---
    // .string({ required_error: "Message is required." })
    .string() // <-- Keep just .string()
    .min(10, {
      message: "Message must be at least 10 characters."
    })
    .max(2000, {
      message: "Message must be 2000 characters or less."
    })
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
