import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell, DashboardHeader } from "@/components";
import { Separator } from "@/components/ui/separator";
import { UserLikesClient } from "@/components/dashboard/user/likes/UserLikesClient";

export const metadata: Metadata = {
  title: "Your Likes | MotoStix",
  description: "View all your liked products"
};

export default async function UserLikesPage() {
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
          title="My Likes"
          description="View the products you liked."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/user" }, { label: "My Likes" }]}
        />
        <Separator className="mb-8" />
        <div className="w-full overflow-hidden">
          <UserLikesClient />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in UserLikesPage:", error);
    redirect("/login");
  }
}
