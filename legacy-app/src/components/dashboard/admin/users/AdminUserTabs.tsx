import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SerializedUser } from "@/types/user";

interface AdminUserTabsProps {
  user: SerializedUser;
}

export function AdminUserTabs({ user }: AdminUserTabsProps) {
  return (
    <div className="space-y-6 w-full max-w-full">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4 grid max-w-7xl grid-cols-3 ">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="space-y-4">
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
            <p>
              <strong>Status:</strong> {user.status}
            </p>
            <p>
              <strong>Email Verified:</strong> {user.emailVerified ? "Yes" : "No"}
            </p>
            <p>
              <strong>Registered:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            <p>
              <strong>Has Password:</strong> {user.hasPassword ? "Yes" : "No"}
            </p>
            <p>
              <strong>2FA Enabled:</strong> {user.has2FA ? "Yes" : "No"}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="text-muted-foreground text-sm">User activity log component goes here.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
