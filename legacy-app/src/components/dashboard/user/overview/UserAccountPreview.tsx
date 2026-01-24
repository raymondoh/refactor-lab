"use client";

import { AccountSummary } from "./AccountSummary";
import { AccountSummarySkeleton } from "./AccountSummarySkeleton";
import type { SerializedUser } from "@/types/user";

type Props = {
  serializedUserData: SerializedUser;
  isLoading?: boolean;
};

export function UserAccountPreview({ serializedUserData, isLoading = false }: Props) {
  if (isLoading || !serializedUserData) {
    return <AccountSummarySkeleton />;
  }

  // Simply pass the already-serialized user data to AccountSummary.
  return <AccountSummary user={serializedUserData} profileUrl="/user/profile" />;
}
