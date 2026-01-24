"use client";

import { useState } from "react";
import { UserActivityLogTable } from "./UserActivityLogTable";
import { clientFetchActivityLogs } from "@/actions/client";
import type { SerializedActivity } from "@/types/firebase/activity";

interface UserActivityPageClientProps {
  initialLogs: SerializedActivity[];
}

export function UserActivityPageClient({ initialLogs }: UserActivityPageClientProps) {
  const [activities, setActivities] = useState(initialLogs || []);
  const [lastActivityId, setLastActivityId] = useState(
    initialLogs.length > 0 ? initialLogs[initialLogs.length - 1].id : undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialLogs.length === 10); // page size

  const loadMore = async () => {
    setIsLoading(true);

    try {
      const result = await clientFetchActivityLogs({ limit: 10, startAfter: lastActivityId });

      if (result.success && Array.isArray(result.activities) && result.activities.length > 0) {
        setActivities(prev => [...prev, ...(result.activities ?? [])]);
        setLastActivityId(result.activities[result.activities.length - 1].id);
        if (result.activities.length < 10) {
          setHasMore(false);
        }
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
    <div className="space-y-4">
      <UserActivityLogTable activities={activities} isRefreshing={isLoading} />

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            className="rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/70 disabled:opacity-50">
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
