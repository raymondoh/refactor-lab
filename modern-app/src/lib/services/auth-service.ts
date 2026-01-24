// src/lib/services/auth-service.ts
import { UpdateUserData, User } from "../types/user";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { App } from "firebase-admin/app";

export interface AuthService {
  createUser(email: string, password: string, name?: string, role?: string): Promise<User>;
  validateCredentials(email: string, password: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: UpdateUserData): Promise<User | null>;
  verifyUserEmail(email: string): Promise<boolean>;
  updateUserPassword(email: string, newPassword: string): Promise<boolean>;
  deleteUser(id: string): Promise<boolean>;
  promoteToAdmin(id: string): Promise<boolean>;
  getFirebaseServices?(): { auth: Auth; db: Firestore; app: App }; // Optional for mock implementations
}
