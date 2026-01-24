import { DashboardShell, DashboardHeader } from "@/components";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserDataPrivacyLoading() {
  return (
    <DashboardShell>
      <DashboardHeader title="Data & Privacy" description="Manage your data, export it, or delete your account." />
      <Separator className="mb-8" />

      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="h-[240px] w-full" />
        <Skeleton className="h-[240px] w-full" />
      </div>
    </DashboardShell>
  );
}
