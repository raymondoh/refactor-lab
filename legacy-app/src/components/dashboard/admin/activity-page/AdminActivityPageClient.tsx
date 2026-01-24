"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminActivityLogClient } from "./AdminActivityLogClient";
import type { Firebase } from "@/types";
import { clientFetchActivityLogs } from "@/actions/client";

interface AdminActivityPageClientProps {
  initialLogs: Firebase.SerializedActivity[];
}

export function AdminActivityPageClient({ initialLogs }: AdminActivityPageClientProps) {
  const [activities, setActivities] = useState<Firebase.SerializedActivity[]>(initialLogs);
  //const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const [lastActivityId, setLastActivityId] = useState<string | undefined>(
    initialLogs.length > 0 ? initialLogs[initialLogs.length - 1].id : undefined
  );

  const [activeType] = useState<string | undefined>();

  //const lastActivity = activities[activities.length - 1];

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const result = await clientFetchActivityLogs({
        limit: 10,
        startAfter: lastActivityId,
        type: activeType
      });

      if (result.success && Array.isArray(result.activities) && result.activities.length > 0) {
        const newActivities = result.activities; // Fully narrowed here
        setActivities(prev => [...prev, ...newActivities]);
        setLastActivityId(newActivities[newActivities.length - 1].id);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <Card className="p-4 sm:p-6 w-full overflow-hidden">
        <AdminActivityLogClient activities={activities} />

        {hasMore && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={loadMore} disabled={isLoading}>
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
