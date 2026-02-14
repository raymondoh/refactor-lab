// src/actions/auth/login.ts
"use server";

import { signIn } from "@/auth";
import { loginSchema } from "@/schemas/auth/login";
import { ok, fail } from "@/lib/services/service-result";
import { AuthError } from "next-auth";
import type { z } from "zod";

type LoginInput = z.infer<typeof loginSchema>;

export async function loginAction(idToken: string) {
  try {
    // Pass the token we got from the client-side Firebase login
    await signIn("credentials", {
      idToken,
      redirect: false
    });
    return ok({ success: true });

    return ok({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return fail("UNAUTHENTICATED", "Invalid email or password.");
        default:
          return fail("UNKNOWN", "Something went wrong during sign in.");
      }
    }
    throw error; // Let Next.js handle redirects if not an AuthError
  }
}
export { loginAction as loginUser };
