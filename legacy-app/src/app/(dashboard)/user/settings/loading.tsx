import { DashboardShell, DashboardHeader } from "@/components";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function UserSettingsLoading() {
  return (
    <DashboardShell>
      <DashboardHeader title="Settings" description="Manage your account settings and security preferences" />
      <Separator className="mb-8" />

      <div className="w-full max-w-4xl overflow-hidden">
        <Tabs defaultValue="security" className="w-full">
          <TabsList className="mb-8 w-full sm:w-auto">
            <TabsTrigger value="security" className="flex-1 sm:flex-initial px-5">
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 sm:flex-initial px-5">
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6">
            <div className="profile-form-container">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-80 mb-4" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-32" />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="profile-form-container">
              <Skeleton className="h-6 w-60 mb-2" />
              <Skeleton className="h-4 w-80 mb-4" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-32" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
