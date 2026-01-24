import { DashboardShell, DashboardHeader } from "@/components";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfileLoading() {
  return (
    <DashboardShell>
      <DashboardHeader title="User Profile" description="Loading user profile..." />
      <Separator className="mb-8" />

      <div className="max-w-4xl">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
