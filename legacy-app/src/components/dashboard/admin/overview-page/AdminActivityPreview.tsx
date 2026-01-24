"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/date";
import { collection, getDocs } from "firebase/firestore";
import type { AdminActivityLogWrapperProps } from "@/types/dashboard";
import { UserAvatar } from "@/components/shared/UserAvatar";

export function AdminActivityPreview({
  activities,
  limit = 5,
  showHeader = true,
  showViewAll = true,
  viewAllUrl = "/admin/activity"
}: AdminActivityLogWrapperProps) {
  // 1. Update the type for your map to include the optional image property
  const [usersMap, setUsersMap] = useState<Map<string, { name?: string; email?: string; image?: string | null }>>(
    new Map()
  );

  useEffect(() => {
    async function loadUsers() {
      try {
        const { db } = await import("@/firebase/client/firebase-client-init");
        const snapshot = await getDocs(collection(db, "users"));
        const map = new Map<string, { name?: string; email?: string; image?: string | null }>();

        snapshot.forEach(doc => {
          const data = doc.data();
          map.set(doc.id, {
            name: data.name,
            email: data.email,
            // 2. Fetch the image URL here, just like in your AdminUserPreview component
            image: data.image || data.picture || data.photoURL || null
          });
        });

        setUsersMap(map);
      } catch (err) {
        console.warn("Failed to fetch user map:", err);
      }
    }

    loadUsers();
  }, []);

  // 3. Enrich the activities with the user data from the map, including the image
  const enrichedActivities = activities.slice(0, limit).map(activity => {
    const user = usersMap.get(activity.userId);
    // Use the most up-to-date user info from the map, falling back to the activity log's data
    const displayName = user?.name || activity.name || activity.userEmail?.split("@")[0] || "Unknown User";
    const displayEmail = user?.email || activity.userEmail;
    const displayImage = user?.image || activity.image; // Prioritize image from user profile

    return {
      ...activity,
      displayName,
      displayEmail,
      displayImage
    };
  });

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest admin and user activity</CardDescription>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          enrichedActivities.map(activity => (
            <div key={activity.id} className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 4. Pass the new displayImage to the UserAvatar's src prop */}
                  <UserAvatar
                    src={activity.displayImage}
                    name={activity.displayName}
                    email={activity.displayEmail}
                    className="h-8 w-8"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{activity.displayName}</span>
                    {activity.displayEmail && (
                      <span className="text-xs text-muted-foreground">{activity.displayEmail}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(activity.timestamp, { relative: true })}
                </span>
              </div>
              <p className="text-xs">{activity.description}</p>
            </div>
          ))
        )}
      </CardContent>

      {showViewAll && (
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href={viewAllUrl}>View All Activity</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
