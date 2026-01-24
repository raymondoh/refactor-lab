//src/schemas/auth/login.ts
import { z } from "zod";

// LOGIN
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long")
});

// Types derived from the schemas
export type LoginFormValues = z.infer<typeof loginSchema>;
