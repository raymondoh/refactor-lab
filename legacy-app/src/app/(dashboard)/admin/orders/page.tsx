import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { AdminOrdersClient } from "@/components/dashboard/admin/orders/AdminOrdersClient";
import { redirect } from "next/navigation";
import { fetchAllOrders } from "@/actions/orders";

export const metadata: Metadata = {
  title: "Order Management",
  description: "View and manage all orders in your store."
};

export default async function AdminOrdersPage() {
  try {
    // Dynamic import for auth to avoid build-time issues
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    // ✅ simplest + cheapest admin gate (avoid UserService.getUserRole)
    if (session.user.role !== "admin") {
      redirect("/not-authorized");
    }

    // Fetch initial orders
    const result = await fetchAllOrders();
    const orders = result.success ? result.orders || [] : [];

    return (
      <DashboardShell>
        <DashboardHeader
          title="Order Management"
          description="View and manage all orders in your store."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin" }, { label: "Orders" }]}
        />
        <Separator className="mb-8" />

        <div className="w-full overflow-hidden">
          <AdminOrdersClient orders={orders} />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in AdminOrdersPage:", error);
    redirect("/login");
  }
}
