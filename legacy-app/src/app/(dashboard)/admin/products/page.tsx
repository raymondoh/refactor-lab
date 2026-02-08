// src/app/(dashboard)/admin/products/page.tsx
import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { redirect } from "next/navigation";
import { AdminProductsClient } from "@/components/dashboard/admin/products/AdminProductsClient";

// ✅ Actions own admin gating + call services internally
import { getAllProductsAction } from "@/actions/products/get-all-products";
import { getCategoriesAction, getFeaturedCategoriesAction } from "@/actions/categories/admin-categories";

export const metadata: Metadata = {
  title: "Product Management",
  description: "Manage products in your catalog"
};

export default async function AdminProductsPage() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) redirect("/login");
    if (session.user.role !== "admin") redirect("/not-authorized");

    // ✅ Fetch initial data via actions (actions gate + services do the work)
    const [productsResult, categoriesRes, featuredRes] = await Promise.all([
      getAllProductsAction(),
      getCategoriesAction(),
      getFeaturedCategoriesAction()
    ]);

    const products = productsResult.success ? productsResult.data : [];
    const categories = categoriesRes.success ? categoriesRes.data.categories : [];

    const featuredCategories = featuredRes.success
      ? featuredRes.data.featuredCategories.map(cat => ({
          id: cat.slug,
          name: cat.name,
          count: cat.count,
          image: cat.image
        }))
      : [];

    return (
      <DashboardShell>
        <DashboardHeader
          title="Product Management"
          description="View and manage products in your catalog."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin" }, { label: "Products" }]}
        />
        <Separator className="mb-8" />

        <div className="w-full overflow-hidden">
          <AdminProductsClient
            products={products}
            categories={categories || []}
            featuredCategories={featuredCategories}
          />
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error in AdminProductsPage:", error);
    redirect("/login");
  }
}
