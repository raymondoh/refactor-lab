import { Skeleton } from "@/components/ui/skeleton";
import { DashboardShell, DashboardHeader } from "@/components";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboardLoading() {
  return (
    <DashboardShell>
      <DashboardHeader title="Admin Dashboard" description="Loading overview..." />
      <Separator className="mb-8" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[220px] w-full" />
        <Skeleton className="h-[220px] w-full" />
        <Skeleton className="h-[220px] w-full" />
        <Skeleton className="h-[220px] w-full" />
      </div>
    </DashboardShell>
  );
}
