import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { DashboardShell, DashboardHeader } from "@/components";
import { redirect } from "next/navigation";
import { getAllProducts } from "@/firebase/admin/products";
import { getCategories, getFeaturedCategories } from "@/firebase/admin/categories";
import { UserService } from "@/lib/services/user-service";
import { AdminProductsClient } from "@/components/dashboard/admin/products/AdminProductsClient";

export const metadata: Metadata = {
  title: "Product Management",
  description: "Manage products in your catalog"
};

export default async function AdminProductsPage() {
  try {
    // Dynamic import for auth to avoid build-time issues
    const { auth } = await import("@/auth");
    const session = await auth();

    // Redirect if not authenticated
    if (!session?.user) {
      redirect("/login");
    }

    // Check admin role using UserService
    const userRole = await UserService.getUserRole(session.user.id);
    if (userRole !== "admin") {
      redirect("/not-authorized");
    }

    // Fetch initial products data
    const productsResult = await getAllProducts();
    const products = productsResult.success ? productsResult.data : [];

    // Fetch categories data
    const categoriesResult = await getCategories();
    const categories = categoriesResult.success ? categoriesResult.data : [];

    // Fetch featured categories data
    const featuredCategoriesResult = await getFeaturedCategories();

    // Map the featured categories to include the id property
    const featuredCategories = featuredCategoriesResult.success
      ? featuredCategoriesResult.data.map(cat => ({
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

        {/* Added a container with overflow handling */}
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
