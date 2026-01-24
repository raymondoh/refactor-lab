// src/lib/auth/token.ts
import crypto from "crypto";
import { config } from "@/lib/config/app-mode";
import { logger } from "@/lib/logger";

// Lazily import userService only when needed to avoid initializing Firebase
async function getUserService() {
  const { userService } = await import("@/lib/services/user-service");
  return userService;
}

export class TokenService {
  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  // --- Email Verification Tokens ---

  async createEmailVerificationToken(email: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    if (config.isMockMode) {
      logger.info("[auth.token] Mock: Storing verification token");

      if (!globalThis.mockTokens) {
        globalThis.mockTokens = new Map();
      }

      globalThis.mockTokens.set(token, { email, expiresAt });
    } else {
      const userService = await getUserService();
      await userService.storeVerificationToken(email, token, expiresAt);
    }

    return token;
  }

  async verifyAndConsumeEmailVerificationToken(
    token: string
  ): Promise<{ valid: boolean; email?: string; error?: string }> {
    if (config.isMockMode) {
      logger.info("[auth.token] Mock: Verifying verification token");

      if (!globalThis.mockTokens) {
        globalThis.mockTokens = new Map();
      }

      const tokenData = globalThis.mockTokens.get(token);

      if (!tokenData || tokenData.expiresAt < new Date()) {
        if (tokenData) {
          globalThis.mockTokens.delete(token);
        }
        return { valid: false, error: "Invalid or expired token" };
      }

      globalThis.mockTokens.delete(token);
      return { valid: true, email: tokenData.email };
    }

    const userService = await getUserService();
    const email = await userService.verifyAndConsumeToken(token, "verification");

    if (email) {
      return { valid: true, email };
    }

    return { valid: false, error: "Invalid or expired token" };
  }

  // --- Password Reset Tokens ---

  async createPasswordResetToken(email: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (config.isMockMode) {
      logger.info("[auth.token] Mock: Storing password reset token");

      if (!globalThis.mockResetTokens) {
        globalThis.mockResetTokens = new Map();
      }

      globalThis.mockResetTokens.set(token, { email, expiresAt });
    } else {
      const userService = await getUserService();
      await userService.storePasswordResetToken(email, token, expiresAt);
    }

    return token;
  }

  async consumePasswordResetToken(token: string): Promise<string | null> {
    if (config.isMockMode) {
      logger.info("[auth.token] Mock: Consuming password reset token");

      if (!globalThis.mockResetTokens) {
        globalThis.mockResetTokens = new Map();
      }

      const tokenData = globalThis.mockResetTokens.get(token);

      if (!tokenData || tokenData.expiresAt < new Date()) {
        if (tokenData) {
          globalThis.mockResetTokens.delete(token);
        }
        return null;
      }

      globalThis.mockResetTokens.delete(token);
      return tokenData.email;
    }

    const userService = await getUserService();
    return userService.verifyAndConsumeToken(token, "password_reset");
  }

  async checkToken(
    token: string,
    type: "verification" | "password_reset"
  ): Promise<{ valid: boolean; email?: string; error?: string }> {
    if (config.isMockMode) {
      const mockStore = type === "verification" ? globalThis.mockTokens : globalThis.mockResetTokens;

      const tokenData = mockStore?.get(token);

      if (!tokenData || tokenData.expiresAt < new Date()) {
        return { valid: false, error: "Invalid or expired token" };
      }

      return { valid: true, email: tokenData.email };
    }

    const userService = await getUserService();
    const email = await userService.verifyTokenWithoutConsuming(token, type);

    if (email) {
      return { valid: true, email };
    }

    return { valid: false, error: "Invalid or expired token" };
  }
}

export const tokenService = new TokenService();

// Define global types for mock storage
declare global {
  var mockTokens: Map<string, { email: string; expiresAt: Date }> | undefined;
  var mockResetTokens: Map<string, { email: string; expiresAt: Date }> | undefined;
}
