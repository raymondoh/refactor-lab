// src/app/dashboard/admin/users/page.tsx
import { userService } from "@/lib/services/user-service";
import { UsersPageClient } from "./users-page-client"; // We will create this next

export default async function AdminUsersPage() {
  // Fetch initial data on the server
  const { users, lastVisibleId, totalUserCount } = await userService.getPaginatedUsers({ limit: 6 });

  // Fetch all counts directly from the database
  const [adminCount, tradespersonCount, customerCount, businessOwnerCount, verifiedCount] = await Promise.all([
    userService.getUserCountByRole("admin"),
    userService.getUserCountByRole("tradesperson"),
    userService.getUserCountByRole("customer"),
    userService.getUserCountByRole("business_owner"),
    userService.getVerifiedUserCount()
  ]);

  const initialStats = {
    adminCount,
    tradespersonCount,
    customerCount,
    businessOwnerCount,
    verifiedCount,
    totalUserCount
  };

  return <UsersPageClient initialUsers={users} initialLastVisibleId={lastVisibleId} initialStats={initialStats} />;
}
