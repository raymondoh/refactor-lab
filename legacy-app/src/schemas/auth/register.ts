//src/schemas/auth/register.ts
import { z } from "zod";

// REGISTRATION
export const registerSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(4, { message: "Password must be at least 8 characters long" })
      .max(72, { message: "Password must not exceed 72 characters" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      }),
    confirmPassword: z.string()
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

// Types derived from the schemas
export type RegisterFormValues = z.infer<typeof registerSchema>;
