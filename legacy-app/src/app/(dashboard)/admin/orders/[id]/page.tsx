// import { redirect } from "next/navigation";
// import { Separator } from "@/components/ui/separator";
// import { DashboardShell, DashboardHeader } from "@/components";
// import { getOrderById } from "@/firebase/admin/orders";
// import { UserService } from "@/lib/services/user-service";
// // 1. Import the formatPrice function
// import { formatPrice } from "@/lib/utils";

// // export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
// // Corrected params type
// export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
//   try {
//     const { auth } = await import("@/auth");
//     const session = await auth();

//     if (!session?.user) {
//       redirect("/login");
//     }

//     const userRole = await UserService.getUserRole(session.user.id);
//     if (userRole !== "admin") {
//       redirect("/not-authorized");
//     }

//     // No need to await params in this simplified version
//     //const { id } = params;
//     //Await params for Next.js 15 compatibility
//     const { id } = await params;

//     const order = await getOrderById(id);

//     if (!order) {
//       redirect("/admin/orders");
//     }

//     return (
//       <DashboardShell>
//         <DashboardHeader
//           title={`Order #${order.id.slice(0, 8).toUpperCase()}`} // Shorten ID for display
//           description="Order details and management"
//           breadcrumbs={[
//             { label: "Home", href: "/" },
//             { label: "Admin", href: "/admin" },
//             { label: "Orders", href: "/admin/orders" },
//             { label: `Order #${order.id.slice(0, 8).toUpperCase()}` }
//           ]}
//         />
//         <Separator className="mb-8" />

//         <div className="w-full max-w-4xl space-y-6">
//           <div className="p-6 border rounded-lg">
//             <h3 className="text-lg font-semibold mb-4">Order Information</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-muted-foreground">Order Date</p>
//                 <p>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Unknown"}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Status</p>
//                 <p className="capitalize">{order.status}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Customer</p>
//                 <p>{order.customerName || order.customerEmail}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Total Amount</p>
//                 {/* 2. Use the formatPrice function here */}
//                 <p className="font-bold">{formatPrice(order.amount, "gbp")}</p>
//               </div>
//             </div>
//           </div>

//           {order.items && order.items.length > 0 && (
//             <div className="p-6 border rounded-lg">
//               <h3 className="text-lg font-semibold mb-4">Order Items</h3>
//               <div className="space-y-4">
//                 {order.items.map((item, index) => (
//                   <div key={index} className="flex justify-between items-center p-4 bg-secondary/10 rounded-lg">
//                     <div>
//                       <p className="font-medium">{item.name}</p>
//                       <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
//                     </div>
//                     {/* 3. Also use the formatPrice function here */}
//                     <p className="font-bold">{formatPrice(item.price, "gbp")}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {order.shippingAddress && (
//             <div className="p-6 border rounded-lg">
//               <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
//               <div className="text-sm text-muted-foreground space-y-0.5">
//                 {/* FIX: Get the name from the main order object */}
//                 <p className="font-medium text-foreground">{order.customerName}</p>

//                 {/* FIX: Use the correct property 'address' from your type */}
//                 <p>{order.shippingAddress.address}</p>

//                 {/* Note: 'line2' does not exist on your type. You can add it if needed. */}

//                 <p>
//                   {/* FIX: Use the correct property 'zipCode' from your type */}
//                   {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
//                 </p>
//                 <p>{order.shippingAddress.country}</p>
//               </div>
//             </div>
//           )}
//         </div>
//       </DashboardShell>
//     );
//   } catch (error) {
//     console.error("Error in AdminOrderDetailPage:", error);
//     redirect("/admin/orders");
//   }
// }
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { getOrderById } from "@/firebase/admin/orders";
import { UserService } from "@/lib/services/user-service";
// 1. Import the formatPrice function
import { formatPrice } from "@/lib/utils";
// Remove TAX_RATE and SHIPPING_CONFIG as they are no longer used for calculation in this file.
// import { TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout";

// Corrected params type for Next.js App Router dynamic segments
export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    const userRole = await UserService.getUserRole(session.user.id);
    if (userRole !== "admin") {
      redirect("/not-authorized");
    }

    // Direct access to id from params
    const { id } = await params;

    const order = await getOrderById(id);

    if (!order) {
      redirect("/admin/orders");
    }

    // --- FIX: Removed incorrect recalculation of tax, shipping, and total.
    // The order.amount is already the total paid.
    // const tax = order.amount * TAX_RATE;
    // const shipping = order.amount > SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.flatRate;
    // const total = order.amount + tax + shipping;
    // --- END FIX ---

    return (
      <DashboardShell>
        <DashboardHeader
          title={`Order #${order.id.slice(0, 8).toUpperCase()}`} // Shorten ID for display
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
                {/* 2. Use the formatPrice function here directly with order.amount */}
                <p className="font-bold">{formatPrice(order.amount, "gbp")}</p>
              </div>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-secondary/10 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    {/* 3. Also use the formatPrice function here */}
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
