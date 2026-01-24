"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/date";
import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle, Info, XCircle, Clock } from "lucide-react";
import type { SerializedActivity } from "@/types/firebase/activity";

interface UserActivityPreviewProps {
  activities: SerializedActivity[];
  limit?: number;
  loading?: boolean;
  showHeader?: boolean;
  showViewAll?: boolean;
  viewAllUrl?: string;
  showFilters?: boolean;
}

export function UserActivityPreview({
  activities,
  limit = 5,
  loading = false,
  showHeader = true,
  showViewAll = true,
  viewAllUrl = "/user/activity"
}: UserActivityPreviewProps) {
  // Helper function to determine icon based on activity type
  const getActivityIcon = (activity: SerializedActivity) => {
    // You can customize this logic based on your activity types
    const type = activity.type || activity.metadata?.type || "info";

    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent activity on your account</CardDescription>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="pt-2">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[220px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-3" />
            <h4 className="text-base font-medium">No activity yet</h4>
            <p className="text-sm text-muted-foreground mt-1">Your recent account activities will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, limit).map(activity => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 transition-colors hover:bg-muted">
                <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{activity.description}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatDate(activity.timestamp, { relative: true })}
                    </span>
                  </div>
                  {activity.metadata?.details && (
                    <p className="text-xs text-muted-foreground mt-1">{activity.metadata.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {showViewAll && activities.length > 0 && (
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href={viewAllUrl}>View Full Activity</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
