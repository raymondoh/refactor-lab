"use server";

import { analyticsService } from "@/lib/services/analytics-service";

interface Params {
  start?: string;
  end?: string;
  region?: string;
}

export async function getFilteredAnalytics({ start, end, region }: Params) {
  const monthly = await analyticsService.getMonthlyMetrics({
    start: start ? new Date(start) : undefined,
    end: end ? new Date(end) : undefined,
    region
  });
  return { monthly };
}

