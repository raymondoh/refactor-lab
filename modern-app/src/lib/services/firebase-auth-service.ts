// // src/lib/services/firebase-auth-service.ts
// import { getFirebaseAdminAuth, getFirebaseAdminDb, getFirebaseAdminApp, UsersCollection } from "@/lib/firebase/admin";
// import { logger } from "@/lib/logger";
// import type { Auth } from "firebase-admin/auth";
// import type { App } from "firebase-admin/app";
// import type { User, UpdateUserData } from "../types/user";
// import type { UserRole } from "@/lib/auth/roles";
// import type { AuthService } from "./auth-service";
// import type { Timestamp } from "firebase-admin/firestore";
// import bcrypt from "bcryptjs";

// // Firestore stores date fields as Timestamp objects. When fetching user
// // documents we cast them to this shape so TypeScript knows the properties
// // that may exist on the document returned from Firestore.
// type FirestoreUserData = User & {
//   hashedPassword?: string;
//   postcode?: string | null;
//   town?: string | null;
//   address?: string | null;
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
//   lastLoginAt?: Timestamp;
// };

// export class FirebaseAuthService implements AuthService {
//   private auth: Auth;
//   private app: App;

//   constructor() {
//     this.auth = getFirebaseAdminAuth();
//     this.app = getFirebaseAdminApp();
//   }

//   getFirebaseServices() {
//     return {
//       auth: this.auth,
//       db: getFirebaseAdminDb(),
//       app: this.app
//     };
//   }

//   async testConnection(): Promise<boolean> {
//     try {
//       await this.auth.listUsers(1);
//       logger.info("✅ Firebase Auth connection test successful");
//       return true;
//     } catch (error) {
//       logger.warn("❌ Firebase Auth connection test failed:", error);
//       return false;
//     }
//   }

//   async createUser(email: string, password: string, name?: string, role: UserRole = "customer"): Promise<User> {
//     try {
//       logger.info("[FirebaseAuthService] Creating user", { email, role });

//       const usersSnapshot = await UsersCollection().limit(1).get();
//       const isFirstUser = usersSnapshot.empty;
//       const finalRole: UserRole = isFirstUser ? "admin" : role;

//       if (isFirstUser) {
//         logger.info("[FirebaseAuthService] First user detected - elevating to admin", { email });
//       }

//       const hashedPassword = await bcrypt.hash(password, 12);

//       const userRecord = await this.auth.createUser({
//         email,
//         password,
//         displayName: name,
//         emailVerified: false
//       });

//       logger.info("[FirebaseAuthService] Firebase auth user created", { uid: userRecord.uid });

//       const userDoc: User & { hashedPassword: string } = {
//         id: userRecord.uid,
//         email,
//         name: name || null,
//         firstName: null,
//         lastName: null,
//         phone: null,
//         location: {
//           postcode: null,
//           town: null,
//           address: null
//         },
//         businessName: null,
//         serviceAreas: null,
//         specialties: [],
//         experience: null,
//         description: null,
//         hourlyRate: null,
//         profilePicture: null,
//         subscriptionTier: "basic",
//         stripeCustomerId: null,
//         subscriptionStatus: null,
//         role: finalRole,
//         emailVerified: null,
//         onboardingComplete: false,
//         hashedPassword,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };

//       await UsersCollection().doc(userRecord.uid).set(userDoc);
//       logger.info("[FirebaseAuthService] Firestore user document created", {
//         uid: userRecord.uid,
//         role: finalRole
//       });

//       return userDoc;
//     } catch (error) {
//       logger.error("Error creating user:", error);
//       throw new Error("Failed to create user");
//     }
//   }

//   async getUserById(id: string): Promise<User | null> {
//     try {
//       const userDoc = await UsersCollection().doc(id).get();
//       if (!userDoc.exists) return null;

//       const userData = userDoc.data() as FirestoreUserData;
//       const authRecord = await this.auth.getUser(id).catch(() => null);

//       return {
//         id: userDoc.id,
//         email: userData.email,
//         name: userData.name || null,
//         firstName: userData.firstName || null,
//         lastName: userData.lastName || null,
//         phone: userData.phone || null,
//         location: {
//           postcode: userData.location?.postcode ?? userData.postcode ?? null,
//           town: userData.location?.town ?? userData.town ?? null,
//           address: userData.location?.address ?? userData.address ?? null
//         },
//         businessName: userData.businessName || null,
//         serviceAreas: userData.serviceAreas || null,
//         specialties: userData.specialties || [],
//         experience: userData.experience || null,
//         description: userData.description || null,
//         hourlyRate: userData.hourlyRate || null,
//         profilePicture: userData.profilePicture || null,
//         subscriptionTier: userData.subscriptionTier || "free",
//         stripeCustomerId: userData.stripeCustomerId || null,
//         subscriptionStatus: userData.subscriptionStatus || null,
//         emailVerified: authRecord?.emailVerified ? new Date() : null,
//         role: userData.role,
//         onboardingComplete: userData.onboardingComplete || false,
//         createdAt: userData.createdAt?.toDate(),
//         updatedAt: userData.updatedAt?.toDate(),
//         lastLoginAt: userData.lastLoginAt?.toDate()
//       };
//     } catch (error) {
//       logger.error("Error getting user by ID:", error);
//       return null;
//     }
//   }

//   async getUserByEmail(email: string): Promise<User | null> {
//     try {
//       const userQuery = await UsersCollection().where("email", "==", email).limit(1).get();
//       if (userQuery.empty) return null;

//       const userDoc = userQuery.docs[0];
//       const userData = userDoc.data() as FirestoreUserData;
//       const authRecord = await this.auth.getUserByEmail(email).catch(() => null);

//       return {
//         id: userDoc.id,
//         email: userData.email,
//         name: userData.name || null,
//         firstName: userData.firstName || null,
//         lastName: userData.lastName || null,
//         phone: userData.phone || null,
//         location: {
//           postcode: userData.location?.postcode ?? userData.postcode ?? null,
//           town: userData.location?.town ?? userData.town ?? null,
//           address: userData.location?.address ?? userData.address ?? null
//         },
//         businessName: userData.businessName || null,
//         serviceAreas: userData.serviceAreas || null,
//         specialties: userData.specialties || [],
//         experience: userData.experience || null,
//         description: userData.description || null,
//         hourlyRate: userData.hourlyRate || null,
//         profilePicture: userData.profilePicture || null,
//         subscriptionTier: userData.subscriptionTier || "free",
//         stripeCustomerId: userData.stripeCustomerId || null,
//         subscriptionStatus: userData.subscriptionStatus || null,
//         emailVerified: authRecord?.emailVerified ? new Date() : null,
//         role: userData.role,
//         onboardingComplete: userData.onboardingComplete || false,
//         createdAt: userData.createdAt?.toDate(),
//         updatedAt: userData.updatedAt?.toDate(),
//         lastLoginAt: userData.lastLoginAt?.toDate()
//       };
//     } catch (error) {
//       logger.error("Error getting user by email:", error);
//       return null;
//     }
//   }

//   async updateUser(id: string, updates: UpdateUserData): Promise<User | null> {
//     try {
//       const updateData = {
//         ...updates,
//         updatedAt: new Date()
//       };
//       await UsersCollection().doc(id).update(updateData);
//       return this.getUserById(id);
//     } catch (error) {
//       logger.error("Error updating user:", error);
//       throw new Error("Failed to update user");
//     }
//   }

//   async validateCredentials(email: string, password: string): Promise<User | null> {
//     try {
//       const user = await this.getUserByEmail(email);
//       if (!user) {
//         return null;
//       }
//       const userDoc = await UsersCollection().doc(user.id).get();
//       const userData = userDoc.data() as FirestoreUserData;
//       if (!userData?.hashedPassword) {
//         return user;
//       }
//       const isValidPassword = await bcrypt.compare(password, userData.hashedPassword);
//       if (!isValidPassword) {
//         return null;
//       }
//       return user;
//     } catch {
//       return null;
//     }
//   }

//   async verifyUserEmail(email: string): Promise<boolean> {
//     try {
//       const authUser = await this.auth.getUserByEmail(email);
//       await this.auth.updateUser(authUser.uid, { emailVerified: true });
//       await UsersCollection().doc(authUser.uid).update({
//         emailVerified: true,
//         updatedAt: new Date()
//       });
//       return true;
//     } catch {
//       return false;
//     }
//   }

//   async getAllUsers(): Promise<User[]> {
//     try {
//       const usersSnapshot = await UsersCollection().orderBy("createdAt", "desc").get();
//       const users: User[] = [];
//       usersSnapshot.forEach(doc => {
//         const userData = doc.data() as FirestoreUserData;
//         users.push({
//           id: doc.id,
//           email: userData.email,
//           name: userData.name,
//           role: userData.role,
//           emailVerified: userData.emailVerified ? new Date() : null,
//           onboardingComplete: userData.onboardingComplete || false,
//           subscriptionTier: userData.subscriptionTier || "free",
//           stripeCustomerId: userData.stripeCustomerId || null,
//           subscriptionStatus: userData.subscriptionStatus || null,
//           createdAt: userData.createdAt?.toDate() || new Date(),
//           updatedAt: userData.updatedAt?.toDate() || new Date()
//         });
//       });
//       // Service layer returns domain objects (with Date fields), no JSON serialization here
//       return users;
//     } catch {
//       return [];
//     }
//   }

//   async deleteUser(id: string): Promise<boolean> {
//     try {
//       await this.auth.deleteUser(id);
//       await UsersCollection().doc(id).delete();
//       return true;
//     } catch {
//       return false;
//     }
//   }

//   async promoteToAdmin(id: string): Promise<boolean> {
//     try {
//       await UsersCollection().doc(id).update({
//         role: "admin",
//         updatedAt: new Date()
//       });
//       return true;
//     } catch {
//       return false;
//     }
//   }

//   async updateUserPassword(email: string, newPassword: string): Promise<boolean> {
//     try {
//       const hashedPassword = await bcrypt.hash(newPassword, 12);
//       const authUser = await this.auth.getUserByEmail(email);
//       await this.auth.updateUser(authUser.uid, { password: newPassword });
//       await UsersCollection().doc(authUser.uid).update({
//         hashedPassword,
//         updatedAt: new Date()
//       });
//       return true;
//     } catch {
//       return false;
//     }
//   }
// }
// src/lib/services/firebase-auth-service.ts
import { getFirebaseAdminAuth, getFirebaseAdminDb, getFirebaseAdminApp, UsersCollection } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";
import type { Auth } from "firebase-admin/auth";
import type { App } from "firebase-admin/app";
import type { User, UpdateUserData } from "../types/user";
import type { UserRole } from "@/lib/auth/roles";
import type { AuthService } from "./auth-service";
import type { Timestamp } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

// Firestore stores date fields as Timestamp objects. When fetching user
// documents we cast them to this shape so TypeScript knows the properties
// that may exist on the document returned from Firestore.
type FirestoreUserData = User & {
  hashedPassword?: string;
  postcode?: string | null;
  town?: string | null;
  address?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
};

export class FirebaseAuthService implements AuthService {
  private auth: Auth;
  private app: App;

  constructor() {
    this.auth = getFirebaseAdminAuth();
    this.app = getFirebaseAdminApp();
  }

  getFirebaseServices() {
    return {
      auth: this.auth,
      db: getFirebaseAdminDb(),
      app: this.app
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.auth.listUsers(1);
      logger.info("✅ Firebase Auth connection test successful");
      return true;
    } catch (error) {
      logger.warn("❌ Firebase Auth connection test failed:", error);
      return false;
    }
  }

  async createUser(email: string, password: string, name?: string, role: UserRole = "customer"): Promise<User> {
    try {
      logger.info("[FirebaseAuthService] Creating user", { email, role });

      const usersSnapshot = await UsersCollection().limit(1).get();
      const isFirstUser = usersSnapshot.empty;
      const finalRole: UserRole = isFirstUser ? "admin" : role;

      if (isFirstUser) {
        logger.info("[FirebaseAuthService] First user detected - elevating to admin", { email });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const userRecord = await this.auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: false
      });

      logger.info("[FirebaseAuthService] Firebase auth user created", { uid: userRecord.uid });

      const userDoc: User & { hashedPassword: string } = {
        id: userRecord.uid,
        email,
        name: name || null,
        firstName: null,
        lastName: null,
        phone: null,
        location: {
          postcode: null,
          town: null,
          address: null
        },
        businessName: null,
        serviceAreas: null,
        specialties: [],
        experience: null,
        description: null,
        hourlyRate: null,
        profilePicture: null,
        subscriptionTier: "basic",
        stripeCustomerId: null,
        subscriptionStatus: null,
        role: finalRole,
        emailVerified: null,
        onboardingComplete: false,
        hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await UsersCollection().doc(userRecord.uid).set(userDoc);
      logger.info("[FirebaseAuthService] Firestore user document created", {
        uid: userRecord.uid,
        role: finalRole
      });

      return userDoc;
    } catch (error) {
      logger.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const userDoc = await UsersCollection().doc(id).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data() as FirestoreUserData;
      const authRecord = await this.auth.getUser(id).catch(() => null);

      return {
        id: userDoc.id,
        email: userData.email,
        name: userData.name || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        phone: userData.phone || null,
        location: {
          postcode: userData.location?.postcode ?? userData.postcode ?? null,
          town: userData.location?.town ?? userData.town ?? null,
          address: userData.location?.address ?? userData.address ?? null
        },
        businessName: userData.businessName || null,
        serviceAreas: userData.serviceAreas || null,
        specialties: userData.specialties || [],
        experience: userData.experience || null,
        description: userData.description || null,
        hourlyRate: userData.hourlyRate || null,
        profilePicture: userData.profilePicture || null,
        subscriptionTier: userData.subscriptionTier || "basic", // Fixed: changed "free" to "basic"
        stripeCustomerId: userData.stripeCustomerId || null,
        subscriptionStatus: userData.subscriptionStatus || null,
        emailVerified: authRecord?.emailVerified ? new Date() : null,
        role: userData.role,
        onboardingComplete: userData.onboardingComplete || false,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
        lastLoginAt: userData.lastLoginAt?.toDate()
      };
    } catch (error) {
      logger.error("Error getting user by ID:", error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const userQuery = await UsersCollection().where("email", "==", email).limit(1).get();
      if (userQuery.empty) return null;

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data() as FirestoreUserData;
      const authRecord = await this.auth.getUserByEmail(email).catch(() => null);

      return {
        id: userDoc.id,
        email: userData.email,
        name: userData.name || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        phone: userData.phone || null,
        location: {
          postcode: userData.location?.postcode ?? userData.postcode ?? null,
          town: userData.location?.town ?? userData.town ?? null,
          address: userData.location?.address ?? userData.address ?? null
        },
        businessName: userData.businessName || null,
        serviceAreas: userData.serviceAreas || null,
        specialties: userData.specialties || [],
        experience: userData.experience || null,
        description: userData.description || null,
        hourlyRate: userData.hourlyRate || null,
        profilePicture: userData.profilePicture || null,
        subscriptionTier: userData.subscriptionTier || "basic", // Fixed: changed "free" to "basic"
        stripeCustomerId: userData.stripeCustomerId || null,
        subscriptionStatus: userData.subscriptionStatus || null,
        emailVerified: authRecord?.emailVerified ? new Date() : null,
        role: userData.role,
        onboardingComplete: userData.onboardingComplete || false,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
        lastLoginAt: userData.lastLoginAt?.toDate()
      };
    } catch (error) {
      logger.error("Error getting user by email:", error);
      return null;
    }
  }

  async updateUser(id: string, updates: UpdateUserData): Promise<User | null> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      await UsersCollection().doc(id).update(updateData);
      return this.getUserById(id);
    } catch (error) {
      logger.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        return null;
      }
      const userDoc = await UsersCollection().doc(user.id).get();
      const userData = userDoc.data() as FirestoreUserData;
      if (!userData?.hashedPassword) {
        return user;
      }
      const isValidPassword = await bcrypt.compare(password, userData.hashedPassword);
      if (!isValidPassword) {
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  async verifyUserEmail(email: string): Promise<boolean> {
    try {
      const authUser = await this.auth.getUserByEmail(email);
      await this.auth.updateUser(authUser.uid, { emailVerified: true });
      await UsersCollection().doc(authUser.uid).update({
        emailVerified: true,
        updatedAt: new Date()
      });
      return true;
    } catch {
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const usersSnapshot = await UsersCollection().orderBy("createdAt", "desc").get();
      const users: User[] = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data() as FirestoreUserData;
        users.push({
          id: doc.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          emailVerified: userData.emailVerified ? new Date() : null,
          onboardingComplete: userData.onboardingComplete || false,
          subscriptionTier: userData.subscriptionTier || "basic", // Fixed: changed "free" to "basic"
          stripeCustomerId: userData.stripeCustomerId || null,
          subscriptionStatus: userData.subscriptionStatus || null,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date()
        });
      });
      // Service layer returns domain objects (with Date fields), no JSON serialization here
      return users;
    } catch {
      return [];
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await this.auth.deleteUser(id);
      await UsersCollection().doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  async promoteToAdmin(id: string): Promise<boolean> {
    try {
      await UsersCollection().doc(id).update({
        role: "admin",
        updatedAt: new Date()
      });
      return true;
    } catch {
      return false;
    }
  }

  async updateUserPassword(email: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      const authUser = await this.auth.getUserByEmail(email);
      await this.auth.updateUser(authUser.uid, { password: newPassword });
      await UsersCollection().doc(authUser.uid).update({
        hashedPassword,
        updatedAt: new Date()
      });
      return true;
    } catch {
      return false;
    }
  }
}
