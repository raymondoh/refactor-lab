// src/app/api/jobs/filters/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";
import { jobService } from "@/lib/services/job-service";
import type { FilterOptions, JobUrgency } from "@/lib/types/job";

import { logger } from "@/lib/logger";

export async function GET(_request: NextRequest) {
  try {
    const session = await requireSession();

    if (!canAccess(session.user.role, SERVICE_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const jobs = await jobService.getOpenJobs();

    // Urgency distribution
    const urgencyCount: Record<JobUrgency, number> = {
      emergency: 0,
      urgent: 0,
      soon: 0,
      flexible: 0
    };

    jobs.forEach(job => {
      urgencyCount[job.urgency]++;
    });

    // Popular skills
    const skillsMap = new Map<string, number>();
    jobs.forEach(job => {
      if (job.serviceType) {
        skillsMap.set(job.serviceType, (skillsMap.get(job.serviceType) || 0) + 1);
      }
      job.skills?.forEach(skill => {
        skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1);
      });
    });

    const popularSkills = Array.from(skillsMap.entries())
      .map(([skill, count]) => ({ value: skill, label: skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // No quotes yet
    const noQuotesCount = jobs.filter(job => (job.quoteCount || 0) === 0).length;

    // Budget ranges
    const budgetRanges = [
      { label: "Under £100", min: 0, max: 100 },
      { label: "£100 - £300", min: 100, max: 300 },
      { label: "£300+", min: 300 }
    ]
      .map(range => {
        const count = jobs.filter(job => {
          const b = job.budget ?? 0;
          if (range.max === undefined) return b >= range.min;
          if (range.min === 0) return b < range.max;
          return b >= range.min && b <= range.max;
        }).length;
        return { ...range, count };
      })
      .filter(r => r.count > 0);

    // Date posted
    const datePosted = [
      { value: "1", label: "Last 24 hours", days: 1 },
      { value: "3", label: "Last 3 days", days: 3 },
      { value: "7", label: "Last 7 days", days: 7 }
    ]
      .map(opt => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - opt.days);
        const count = jobs.filter(job => job.createdAt >= cutoff).length;
        return { value: opt.value, label: opt.label, count };
      })
      .filter(opt => opt.count > 0);

    const filters: FilterOptions = {
      urgency: [
        { value: "emergency", label: "Emergency", count: urgencyCount.emergency },
        { value: "urgent", label: "Urgent", count: urgencyCount.urgent },
        { value: "soon", label: "This Week", count: urgencyCount.soon },
        { value: "flexible", label: "Flexible", count: urgencyCount.flexible }
      ].filter(option => option.count > 0),
      budgetRanges,
      datePosted,
      popularSkills,
      noQuotesCount,
      locations: []
    };

    return NextResponse.json({ filters });
  } catch (err: unknown) {
    logger.error("[jobs/filters] Error in filters API", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
