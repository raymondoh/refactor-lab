//src/lib/auth/syncUserWithFirebase.ts
import { syncUserWithFirebase as syncUser } from "./syncUserWithFirebase";
import type { AdapterUser } from "next-auth/adapters";
import type { Account } from "next-auth";

export const handleProviderSync = async (user: AdapterUser & { sub?: string }, account: Account | null) => {
  const provider = account?.provider || "unknown";

  const userId = user.id || user.sub || "";
  if (!userId) {
    throw new Error("No user ID found for authentication");
  }

  console.log(`Syncing user with Firebase. Provider: ${provider}, ID: ${userId}`);

  const { role, uid } = await syncUser(userId, {
    email: user.email || "",
    name: user.name || undefined,
    image: user.image || undefined,
    provider,
    providerAccountId: account?.providerAccountId
  });

  return { role, uid };
};
