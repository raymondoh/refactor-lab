import { requireSubscription } from "@/lib/auth/guards";
import { jobService } from "@/lib/services/job-service";
import { addHours } from "date-fns";
import ScheduleCalendar from "./calendar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function SchedulePage() {
  // The layout guard ensures the user is a tradesperson or admin.
  // This subscription guard adds a tier-based check for this specific feature.
  const { session } = await requireSubscription("pro");

  // The manual role check is no longer needed here.

  const jobs = await jobService.getAllJobs();
  const events = jobs
    .filter(j => j.tradespersonId === session.user.id && j.status === "assigned" && j.scheduledDate)
    .map(j => ({
      title: j.title,
      start: j.scheduledDate as Date,
      end: addHours(j.scheduledDate as Date, 1)
    }));

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="My Schedule"
        description="View your upcoming and assigned jobs on the calendar."
      />

      <ScheduleCalendar events={events} />
    </div>
  );
}
