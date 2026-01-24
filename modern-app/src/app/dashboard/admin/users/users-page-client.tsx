// src/app/dashboard/admin/users/UsersPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getPaginatedUsers } from "@/lib/services/user/actions";
import type { User } from "@/lib/types/user";
import { UserTable } from "@/components/admin/user-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, User as UserIcon, CheckCircle, Building2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { clientLogger } from "@/lib/utils/logger";

const StatCard = ({
  title,
  value,
  icon: Icon,
  colorClass = "text-primary"
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${colorClass}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
    </CardContent>
  </Card>
);

interface UsersPageClientProps {
  initialUsers: User[];
  initialLastVisibleId: string | null;
  initialStats: {
    adminCount: number;
    tradespersonCount: number;
    customerCount: number;
    businessOwnerCount: number;
    verifiedCount: number;
    totalUserCount: number;
  };
}

export function UsersPageClient({ initialUsers, initialLastVisibleId, initialStats }: UsersPageClientProps) {
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(initialLastVisibleId);
  const [hasMore, setHasMore] = useState(initialLastVisibleId !== null);
  const [isLoading] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const searchParams = useSearchParams();

  const PAGE_SIZE = 6;

  // This effect will re-initialize the state if the server-provided props change
  useEffect(() => {
    setAllUsers(initialUsers);
    setLastVisibleId(initialLastVisibleId);
    setHasMore(initialLastVisibleId !== null);
  }, [initialUsers, initialLastVisibleId, searchParams]);

  const handleLoadMore = async () => {
    if (!lastVisibleId || !hasMore || isMoreLoading) return;
    setIsMoreLoading(true);
    try {
      const { users: newUsers, lastVisibleId: newCursor } = await getPaginatedUsers({
        limit: PAGE_SIZE,
        lastVisibleId
      });
      setAllUsers(prevUsers => [...prevUsers, ...newUsers]);
      setLastVisibleId(newCursor);
      setHasMore(newCursor !== null);
    } catch (error) {
      clientLogger.error("Failed to load more users:", error);
    } finally {
      setIsMoreLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader title="User Management" description="View, manage, and promote users on the platform." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Admins" value={initialStats.adminCount} icon={Shield} colorClass="text-red-600" />
        <StatCard
          title="Tradespeople"
          value={initialStats.tradespersonCount}
          icon={Users}
          colorClass="text-orange-600"
        />
        <StatCard title="Customers" value={initialStats.customerCount} icon={UserIcon} colorClass="text-blue-600" />
        <StatCard
          title="Business Owners"
          value={initialStats.businessOwnerCount}
          icon={Building2}
          colorClass="text-violet-600"
        />
        <StatCard
          title="Verified Emails"
          value={initialStats.verifiedCount}
          icon={CheckCircle}
          colorClass="text-green-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {isLoading ? "Loading user data..." : `Showing ${allUsers.length} of ${initialStats.totalUserCount} users.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <UserTable users={allUsers} />
              <div className="mt-6 flex flex-col items-center gap-2">
                {hasMore ? (
                  <Button onClick={handleLoadMore} disabled={isMoreLoading}>
                    {isMoreLoading ? "Loading..." : "Load More"}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">No more users to load.</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
