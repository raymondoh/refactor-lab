import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { formatPrice } from "@/lib/utils";
import { adminOrderService } from "@/lib/services/admin-order-service";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    // ✅ simplest + cheapest admin gate (avoid UserService.getUserRole crash)
    if (session.user.role !== "admin") {
      redirect("/not-authorized");
    }

    const { id } = await params;

    const result = await adminOrderService.getOrderById(id);

    if (!result.success || !result.data) {
      redirect("/admin/orders");
    }

    const order = result.data;

    return (
      <DashboardShell>
        <DashboardHeader
          title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
          description="Order details and management"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Admin", href: "/admin" },
            { label: "Orders", href: "/admin/orders" },
            { label: `Order #${order.id.slice(0, 8).toUpperCase()}` }
          ]}
        />
        <Separator className="mb-8" />

        <div className="w-full max-w-4xl space-y-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="capitalize">{order.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p>{order.customerName || order.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-bold">{formatPrice(order.amount, "gbp")}</p>
              </div>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.productId ?? item.name}-${index}`}
                    className="flex justify-between items-center p-4 bg-secondary/10 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-bold">{formatPrice(item.price, "gbp")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.shippingAddress && (
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p className="font-medium text-foreground">{order.customerName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          )}
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in AdminOrderDetailPage:", error);
    redirect("/admin/orders");
  }
}
