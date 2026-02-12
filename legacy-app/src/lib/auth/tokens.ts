// legacy-app/src/lib/auth/tokens.ts
import type { VerifyResult } from "@/lib/services/email-verification-token-service";
import { emailVerificationTokenService } from "@/lib/services/email-verification-token-service";

export const tokenService = {
  async createEmailVerificationToken(email: string): Promise<string> {
    const res = await emailVerificationTokenService.createEmailVerificationToken(email);
    // Preserve old behavior: if something goes wrong, throw (routes already handle)
    if (!res.success) throw new Error(res.error);
    return res.data.token;
  },

  async verifyAndConsumeEmailVerificationToken(token: string): Promise<VerifyResult> {
    const res = await emailVerificationTokenService.verifyAndConsumeEmailVerificationToken(token);
    if (!res.success) return { valid: false, error: res.error };
    return res.data;
  }
};
