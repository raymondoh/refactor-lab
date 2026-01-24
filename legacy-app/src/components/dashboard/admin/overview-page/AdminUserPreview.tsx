"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/date";
import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { User } from "@/types";

interface UserManagementPreviewProps {
  limit?: number;
}

export function AdminUserPreview({ limit: userLimit = 5 }: UserManagementPreviewProps) {
  const [users, setUsers] = useState<User.PreviewUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        // Dynamic import to avoid build-time initialization
        const { db } = await import("@/firebase/client/firebase-client-init");

        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(userLimit));
        const snapshot = await getDocs(usersQuery);

        const usersData: User.PreviewUser[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email,
            image: data.image || data.picture || data.photoURL || null,
            role: data.role || "user",
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            lastLoginAt: data.lastLoginAt?.toDate?.() || data.lastLoginAt
          };
        });

        setUsers(usersData);
      } catch (error) {
        if (isFirebaseError(error)) {
          console.error("Error fetching users:", firebaseError(error));
        } else {
          console.error("Error fetching users:", "An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [userLimit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Users</CardTitle>
        <CardDescription>Newly registered users on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: userLimit }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No users found</p>
        ) : (
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <UserAvatar src={user.image} name={user.name} email={user.email} className="h-10 w-10" />

                  <div>
                    <p className="text-sm font-medium leading-none">
                      {user.name || user.email?.split("@")[0] || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                    <p className="text-xs text-muted-foreground"> {formatDate(user.lastLoginAt, { relative: true })}</p>
                  </div>
                </div>
                <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/admin/users">Manage All Users</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
