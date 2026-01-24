// src/lib/services/mock-auth-service.ts
import type { AuthService } from "./auth-service";
import type { UpdateUserData, User } from "../types/user";
import type { UserRole } from "@/lib/auth/roles";
import { tokenService } from "@/lib/auth/tokens";
import { logger } from "@/lib/logger";

declare global {
  var mockUsers: Map<string, User> | undefined;
}

if (!global.mockUsers) {
  global.mockUsers = new Map<string, User>();
}

export class MockAuthService implements AuthService {
  private users: Map<string, User>;

  constructor() {
    this.users = global.mockUsers!;

    if (this.users.size === 0) {
      this.users.set("admin@test.com", {
        id: "admin-user",
        email: "admin@test.com",
        name: "Admin User",
        emailVerified: new Date(),
        role: "admin",
        favoriteTradespeople: [],
        subscriptionTier: "basic",
        stripeCustomerId: null,
        subscriptionStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardingComplete: true
      });

      this.users.set("customer@test.com", {
        id: "customer-user",
        email: "customer@test.com",
        name: "Test Customer",
        emailVerified: new Date(),
        role: "customer",
        favoriteTradespeople: [],
        subscriptionTier: "basic",
        stripeCustomerId: null,
        subscriptionStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardingComplete: true
      });
    }
  }

  async createUser(email: string, _password: string, name?: string, role: UserRole = "user"): Promise<User> {
    if (this.users.has(email)) {
      throw new Error("User already exists");
    }

    const isFirstUser =
      Array.from(this.users.values()).filter(user => user.email && !user.email.includes("@test.com")).length === 0;
    const finalRole: UserRole = isFirstUser ? "admin" : role;

    if (isFirstUser) {
      logger.info("🎉 Mock: First real user detected - assigning admin role!");
    }

    const userId = `user-${Date.now()}`;

    const userData: User = {
      id: userId,
      email,
      name: name || null,
      firstName: null,
      lastName: null,
      phone: null,
      location: {
        postcode: null,
        town: null,
        address: null,
        latitude: null,
        longitude: null
      },
      businessName: null,
      serviceAreas: null,
      specialties: [],
      experience: null,
      description: null,
      hourlyRate: null,
      profilePicture: null,
      favoriteTradespeople: [],
      subscriptionTier: "basic",
      stripeCustomerId: null,
      subscriptionStatus: null,
      emailVerified: null,
      role: finalRole,
      onboardingComplete: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(email, userData);
    logger.info(`🔥 Mock: Created user ${userId} with role ${finalRole}`);
    return userData;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.id === id);
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = this.users.get(email);
    return user || null;
  }

  async updateUser(id: string, updates: UpdateUserData): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.id === id);
    if (!user || !user.email) return null;

    Object.assign(user, updates, { updatedAt: new Date() });
    this.users.set(user.email, user);
    return user;
  }

  async validateCredentials(email: string, _password?: string): Promise<User | null> {
    const user = this.users.get(email);
    if (!user) {
      return null;
    }
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();
    this.users.set(email, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const users = Array.from(this.users.values())
      .filter(user => user.email && !user.email.includes("@test.com"))
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    return users.map(user => ({
      ...user,
      location: { ...user.location, town: user.location?.town || null }
    }));
  }

  async verifyUserEmail(email: string): Promise<boolean> {
    const user = this.users.get(email);
    if (!user) {
      return false;
    }
    user.emailVerified = new Date();
    user.updatedAt = new Date();
    this.users.set(email, user);
    return true;
  }

  async updateUserPassword(email: string, _newPassword?: string): Promise<boolean> {
    const user = this.users.get(email);
    if (!user) {
      return false;
    }
    user.updatedAt = new Date();
    this.users.set(email, user);
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = Array.from(this.users.values()).find(u => u.id === id);
    if (!user || !user.email) {
      return false;
    }
    this.users.delete(user.email);
    return true;
  }

  async promoteToAdmin(id: string): Promise<boolean> {
    const user = Array.from(this.users.values()).find(u => u.id === id);
    if (!user || !user.email) {
      return false;
    }
    user.role = "admin";
    this.users.set(user.email, user);
    return true;
  }

  async createEmailVerificationToken(email: string): Promise<string> {
    return tokenService.createEmailVerificationToken(email);
  }
}

export const mockAuthService = new MockAuthService();
