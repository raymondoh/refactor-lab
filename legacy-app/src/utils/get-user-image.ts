// utils/get-user-image.ts
import type { User } from "@/types/models/user";
export function getUserImage(data: Partial<User>) {
  return data.image ?? data.picture ?? data.photoURL ?? data.profileImage ?? null;
}
