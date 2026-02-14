// src/app/(dashboard)/admin/products/[id]/page.tsx
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { UpdateProductForm } from "@/components/dashboard/admin/products/UpdateProductForm";
import { getProductByIdAction } from "@/actions/products/get-product";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
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

    const result = await getProductByIdAction(id);

    // 1. Check if the result failed
    if (!result.ok) {
      redirect("/admin/products");
    }

    // keep your legacy guard shape
    if (!("product" in result) || !result.product) {
      redirect("/admin/products");
    }

    // 2. Destructure product from data.
    // We use result.data because in the 'ok' state, that's where the payload lives.
    const { product } = result.data;

    return (
      <DashboardShell>
        <DashboardHeader
          title="Edit Product"
          description="Update product information and settings"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Admin", href: "/admin" },
            { label: "Products", href: "/admin/products" },
            { label: product.name || "Edit" }
          ]}
        />
        <Separator className="mb-8" />

        <div className="w-full max-w-7xl overflow-hidden">
          <UpdateProductForm product={product} />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in AdminProductEditPage:", error);
    redirect("/admin/products");
  }
}
