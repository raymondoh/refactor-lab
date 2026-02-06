import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { redirect } from "next/navigation";
import { adminProductService } from "@/lib/services/admin-product-service";
import { adminCategoryService } from "@/lib/services/admin-category-service";
import { AdminProductsClient } from "@/components/dashboard/admin/products/AdminProductsClient";

export const metadata: Metadata = {
  title: "Product Management",
  description: "Manage products in your catalog"
};

export default async function AdminProductsPage() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    // ✅ simplest + cheapest admin gate
    if (session.user.role !== "admin") {
      redirect("/not-authorized");
    }

    // Fetch initial products data
    const productsResult = await adminProductService.getAllProducts();
    const products = productsResult.success ? productsResult.data : [];

    // Fetch categories data (service layer)
    const categoriesRes = await adminCategoryService.getCategories();
    const categories = categoriesRes.success ? categoriesRes.data.categories : [];

    // Fetch featured categories data (service layer)
    const featuredRes = await adminCategoryService.getFeaturedCategories();
    const featuredCategories = featuredRes.success
      ? featuredRes.data.featuredCategories.map(cat => ({
          id: cat.slug, // Use slug as id
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
