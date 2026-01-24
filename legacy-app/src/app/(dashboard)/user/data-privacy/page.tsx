import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { DataExport } from "@/components/dashboard/user/data-privacy/DataExport";
import { AccountDeletion } from "@/components/dashboard/user/data-privacy/AccountDeletion";

export default async function DataPrivacyPage() {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    return (
      <DashboardShell>
        <DashboardHeader
          title="Data & Privacy"
          description="Manage your personal data and privacy settings"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Dashboard", href: "/user" },
            { label: "Data & Privacy" }
          ]}
        />
        <Separator className="mb-8" />

        <div className="w-full grid gap-4 md:gap-8 md:grid-cols-2">
          <DataExport />
          <AccountDeletion />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in DataPrivacyPage:", error);
    redirect("/login");
  }
}
