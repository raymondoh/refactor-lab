// src/lib/services/user/auth.ts
// This file handles user authentication and password management.
import { getFirebaseAdminAuth, UsersCollection } from "@/lib/firebase/admin";
import { mapToUser } from "./utils";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "./actions";
import type { User } from "@/lib/types/user";
import { logger } from "@/lib/logger";

export async function validateCredentials(email: string, password: string): Promise<User | null> {
  try {
    const usersCollection = UsersCollection();
    const userQuery = await usersCollection.where("email", "==", email).limit(1).get();
    if (userQuery.empty) return null;

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data() as { hashedPassword?: string };
    if (!userData.hashedPassword) return null;

    const isValid = await bcrypt.compare(password, userData.hashedPassword);
    if (!isValid) return null;

    await userDoc.ref.update({ lastLoginAt: new Date() });

    return mapToUser(userDoc.id, userData);
  } catch (err) {
    logger.error("UserService: validateCredentials error:", err);
    return null;
  }
}

export async function updateUserPassword(email: string, newPassword: string): Promise<boolean> {
  try {
    const user = await getUserByEmail(email);
    if (!user) return false;

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const adminAuth = getFirebaseAdminAuth();
    await adminAuth.updateUser(user.id, { password: newPassword });

    const usersCollection = UsersCollection();
    await usersCollection.doc(user.id).update({
      hashedPassword,
      updatedAt: new Date()
    });

    return true;
  } catch (err) {
    logger.error("UserService: updateUserPassword error:", err);
    return false;
  }
}
