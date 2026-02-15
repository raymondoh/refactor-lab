import { notFound } from "next/navigation";
import { UserOrderDetailCard } from "@/components/dashboard/user/orders/UserOrderDetailCard";
import { DashboardShell, DashboardHeader } from "@/components";
import { Separator } from "@/components/ui/separator";
import { adminOrderService } from "@/lib/services/admin-order-service";

export default async function UserOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) return notFound();

    const { id } = await params;

    const result = await adminOrderService.getOrderById(id);

    if (!result.ok) return notFound();

    const order = result.data;

    // Not found if order doesn't exist OR doesn't belong to this user
    if (!order || order.userId !== session.user.id) return notFound();

    return (
      <DashboardShell>
        <DashboardHeader title="Order Detail" description={`Order ID: ${order.id.slice(0, 8).toUpperCase()}`} />
        <Separator className="mb-8" />
        <div className="max-w-3xl space-y-6">
          <UserOrderDetailCard order={order} />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in UserOrderDetailPage:", error);
    return notFound();
  }
}
