// src/lib/services/user-service.ts

import * as UserActions from "./user/actions";
import * as UserAuth from "./user/auth";
import * as UserFavorites from "./user/favorites";
import * as UserFavoritedBy from "./user/favorited-by";
import * as UserQuotes from "./user/quotes";
import * as UserSearch from "./user/search";
import * as UserTokens from "./user/tokens";

import { config } from "@/lib/config/app-mode";
import { getFirebaseAdminAuth, UsersCollection } from "@/lib/firebase/admin";
import { storageService } from "@/lib/services/storage-service";
import { logger } from "@/lib/logger";

import type { User } from "@/lib/types/user";
import type Stripe from "stripe";
import { mapToUser } from "./user/utils";
import { toSlug } from "@/lib/utils/slugify";

// ---------------------------------------------------------------------------
// Stripe client
// ---------------------------------------------------------------------------
let stripeClientPromise: Promise<Stripe | null> | null = null;

async function getStripeClient(): Promise<Stripe | null> {
  if (stripeClientPromise) return stripeClientPromise;

  stripeClientPromise = (async () => {
    try {
      const stripeModule = await import("@/lib/stripe/server");
      return stripeModule.stripe;
    } catch (error) {
      logger.warn("UserService: Stripe client unavailable:", error);
      return null;
    }
  })();

  return stripeClientPromise;
}

// ---------------------------------------------------------------------------
// UserService class
// ---------------------------------------------------------------------------
class UserService {
  // Core user methods
  findOrCreateUser = UserActions.findOrCreateUser;
  createUser = UserActions.createUser;
  updateUser = UserActions.updateUser;
  promoteToAdmin = UserActions.promoteToAdmin;
  deleteUser = UserActions.deleteUser;
  getUserById = UserActions.getUserById;
  getUserByEmail = UserActions.getUserByEmail;
  getUserBySlug = UserActions.getUserBySlug;
  getPaginatedUsers = UserActions.getPaginatedUsers;
  getAllUsers = UserActions.getAllUsers;
  getTotalUserCount = UserActions.getTotalUserCount;
  verifyUserEmail = UserActions.verifyUserEmail;
  getUserCountByRole = UserActions.getUserCountByRole;
  getVerifiedUserCount = UserActions.getVerifiedUserCount;

  // Auth
  validateCredentials = UserAuth.validateCredentials;
  updateUserPassword = UserAuth.updateUserPassword;

  // Favorites
  addFavoriteTradesperson = UserFavorites.addFavoriteTradesperson;
  removeFavoriteTradesperson = UserFavorites.removeFavoriteTradesperson;
  getFavoriteTradespeople = UserFavorites.getFavoriteTradespeople;
  getCustomersWhoFavorited = UserFavoritedBy.getCustomersWhoFavorited;

  // Quote limits
  canUserSubmitQuote = UserQuotes.canUserSubmitQuote;
  incrementQuoteCount = UserQuotes.incrementQuoteCount;
  resetMonthlyQuotes = UserQuotes.resetMonthlyQuotes;

  // 🔍 Search (Algolia-backed — unchanged)
  getActiveServiceProviders = UserSearch.getActiveServiceProviders;
  getActiveTradespeople = UserSearch.getActiveTradespeople;
  searchUsers = UserSearch.searchUsers;

  async searchTradespeople(params: {
    query: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    try {
      const { users, total } = await UserSearch.searchUsers({
        query: params.query,
        page: params.page,
        limit: params.limit
      });
      return { users, total };
    } catch (error) {
      logger.error("UserService: searchTradespeople (Algolia) error:", error);
      // Graceful fallback – homepage search should not crash
      return { users: [], total: 0 };
    }
  }

  async findTradespeopleByCity(params: {
    citySlug: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 12;

    // 1️⃣ Try Algolia-backed search first
    let algoliaResult: { users: User[]; total: number } | null = null;
    try {
      algoliaResult = await UserSearch.searchUsers({
        city: params.citySlug,
        page,
        limit
      });
    } catch (error) {
      logger.error("UserService: findTradespeopleByCity (Algolia) error:", error);
    }

    if (algoliaResult && algoliaResult.users.length > 0) {
      return algoliaResult;
    }

    // 2️⃣ Firestore fallback – ensure we still show tradespeople
    try {
      const usersCollection = UsersCollection();

      const snapshot = await usersCollection
        .where("citySlug", "==", params.citySlug)
        .where("role", "in", ["tradesperson", "business_owner"])
        .get();

      const allInCity = snapshot.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));

      const tradespeople = allInCity.filter(user => user.role === "tradesperson" || user.role === "business_owner");

      const total = tradespeople.length;
      const paginated = tradespeople.slice((page - 1) * limit, page * limit);

      return {
        users: paginated,
        total
      };
    } catch (error) {
      logger.error("UserService: findTradespeopleByCity (Firestore fallback) error:", error);
      return { users: [], total: 0 };
    }
  }

  async findTradespeopleByCityAndService(params: {
    citySlug: string;
    serviceSlug: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 12;

    // 1️⃣ Try Algolia-backed search first (city + service)
    let algoliaResult: { users: User[]; total: number } | null = null;
    try {
      algoliaResult = await UserSearch.searchUsers({
        city: params.citySlug,
        service: params.serviceSlug,
        page,
        limit
      });
    } catch (error) {
      logger.error("UserService: findTradespeopleByCityAndService (Algolia) error:", error);
    }

    if (algoliaResult && algoliaResult.users.length > 0) {
      return algoliaResult;
    }

    // 2️⃣ Firestore fallback – citySlug in Firestore, service in memory
    try {
      const usersCollection = UsersCollection();

      // 🚀 OPTIMIZATION: Filter by role at the DB level to avoid fetching customers
      const snapshot = await usersCollection
        .where("citySlug", "==", params.citySlug)
        .where("role", "in", ["tradesperson", "business_owner"])
        .get();

      const allInCity = snapshot.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));

      const targetSlug = params.serviceSlug.toLowerCase();

      const tradespeople = allInCity.filter(user => {
        // Redundant check removed since we filter in Query, but kept for type safety if needed
        // if (user.role !== "tradesperson" && user.role !== "business_owner") return false;

        const raw = user as any;
        const serviceSlugs = (raw.serviceSlugs as string[] | undefined) ?? [];
        const serviceType = (raw.serviceType as string | undefined) ?? "";
        const specialties = (raw.specialties as string[] | undefined) ?? [];

        if (serviceSlugs.some(s => s.toLowerCase() === targetSlug)) return true;
        if (serviceType && toSlug(serviceType) === targetSlug) return true;
        if (specialties.some((s: string) => toSlug(s) === targetSlug)) return true;

        return false;
      });

      const total = tradespeople.length;
      const paginated = tradespeople.slice((page - 1) * limit, page * limit);

      return {
        users: paginated,
        total
      };
    } catch (error) {
      logger.error("UserService: findTradespeopleByCityAndService (Firestore fallback) error:", error);
      return { users: [], total: 0 };
    }
  }

  // -----------------------------------------------------------------------
  // ⭐ FIRESTORE AUTHORITATIVE FEATURED TRADESPEOPLE
  //    No Algolia; mapped to domain Users (Dates, location, etc).
  // -----------------------------------------------------------------------
  async getFeaturedTradespeople(limit = 6): Promise<User[]> {
    if (config.isMockMode) return [];

    try {
      const usersCollection = UsersCollection();

      const snap = await usersCollection
        .where("role", "in", ["tradesperson", "business_owner"])
        .where("isFeatured", "==", true)
        .orderBy("featureExpiresAt", "desc")
        .limit(limit)
        .get();

      const users: User[] = snap.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));

      logger.info("Firestore Featured Tradespeople fetched:", { count: users.length });

      return users;
    } catch (error) {
      logger.error("UserService: getFeaturedTradespeople error:", error);
      return [];
    }
  }

  // Tokens
  storeVerificationToken = UserTokens.storeVerificationToken;
  storePasswordResetToken = UserTokens.storePasswordResetToken;
  verifyAndConsumeToken = UserTokens.verifyAndConsumeToken;
  verifyTokenWithoutConsuming = UserTokens.verifyTokenWithoutConsuming;

  /**
   * Checks if the user has a subscription ID but missing period_end dates.
   * If so, fetches from Stripe and updates Firestore.
   */
  async ensureSubscriptionDates(user: User): Promise<User> {
    // 1. precise check: if we have a date, or no sub ID, or it's a mock, do nothing.
    if (
      user.stripeCurrentPeriodEnd ||
      !user.stripeSubscriptionId ||
      user.stripeSubscriptionId.startsWith("sub_mock_")
    ) {
      return user;
    }

    try {
      const stripe = await getStripeClient();
      if (!stripe) return user;

      logger.info("Syncing missing subscription dates from Stripe", { userId: user.id });
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      // 🛠️ FIX: Use a type assertion to safely access the property
      const rawPeriodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;

      const currentPeriodEnd = typeof rawPeriodEnd === "number" ? new Date(rawPeriodEnd * 1000) : null;

      if (currentPeriodEnd) {
        // Update DB
        await this.updateUser(user.id, { stripeCurrentPeriodEnd: currentPeriodEnd });
        // Return updated object
        return { ...user, stripeCurrentPeriodEnd: currentPeriodEnd };
      }
    } catch (error) {
      logger.warn("Failed to sync subscription dates in ensureSubscriptionDates", error);
    }

    return user;
  }

  // Delete account
  async deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: "User ID is required." };

    if (config.isMockMode) return { success: true };

    try {
      const user = await this.getUserById(userId);
      if (!user) return { success: false, error: "User not found." };

      // Stripe cleanup
      if (user.stripeCustomerId) {
        try {
          const stripe = await getStripeClient();
          if (stripe) await stripe.customers.del(user.stripeCustomerId);
        } catch (error) {
          const err = error as { statusCode?: number; code?: string };
          if (err.code !== "resource_missing" && err.statusCode !== 404) {
            logger.error("UserService: Failed to delete Stripe customer:", error);
            return { success: false, error: "Unable to delete Stripe customer record." };
          }
        }
      }

      // Storage cleanup
      try {
        await storageService.deleteFolder(`users/${userId}/`);
      } catch (error) {
        logger.error("UserService: Failed to delete storage folder:", error);
        return { success: false, error: "Failed to delete user files." };
      }

      const usersCollection = UsersCollection();
      await usersCollection.doc(userId).delete();

      const auth = getFirebaseAdminAuth();
      await auth.deleteUser(userId);

      // Note: Firebase Functions will handle Algolia removal

      return { success: true };
    } catch (error) {
      logger.error("UserService: deleteUserAccount error:", error);
      return { success: false, error: "Failed to delete user account." };
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
class UserServiceFactory {
  private static instance: UserService | null = null;

  static getInstance(): UserService {
    if (config.isMockMode) return new UserService();
    if (!UserServiceFactory.instance) {
      UserServiceFactory.instance = new UserService();
    }
    return UserServiceFactory.instance;
  }
}

export const userService = UserServiceFactory.getInstance();
