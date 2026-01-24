// utils/get-user-image.ts
import type { User } from "@/types";
export function getUserImage(data: Partial<User.User>) {
  return data.image ?? data.picture ?? data.photoURL ?? data.profileImage ?? null;
}
