// src/app/(root)/products/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { ProductsProvider } from "@/components/products/ProductsProvider";
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductFilters } from "@/components/products/filters/ProductFilters";
import { CategoryCardsWrapper } from "@/components/products/category-carousel/CategoryCardsWrapper";
import { SubcategoryCardsWrapper } from "@/components/products/subcategory-carousel/SubcategoryCardsWrapper";
import { adminCategoryService } from "@/lib/services/admin-category-service";
import { getAllProductsPublic } from "@/lib/services/products-public-service";
import { Product } from "@/types/product";

export const metadata: Metadata = {
  title: `Products - ${siteConfig.name}`,
  description: "Browse our complete collection of high-quality custom stickers.",
  alternates: {
    canonical: `${siteConfig.url}/products`
  }
};

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

interface ProductsPageProps {
  searchParams: SearchParams;
}

const ProductsPage = async ({ searchParams }: ProductsPageProps) => {
  try {
    const resolvedSearchParams = await searchParams;

    const currentCategory =
      typeof resolvedSearchParams?.category === "string" ? resolvedSearchParams.category : undefined;
    const currentSubcategory =
      typeof resolvedSearchParams?.subcategory === "string" ? resolvedSearchParams.subcategory : undefined;
    const searchQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : undefined;

    const parseBoolean = (value: string | string[] | undefined): boolean | undefined => {
      if (typeof value === "string") return value === "true";
      return undefined;
    };

    const parseArray = (value: string | string[] | undefined): string[] | undefined => {
      if (typeof value === "string")
        return value
          .split(",")
          .map(v => v.trim())
          .filter(Boolean);
      if (Array.isArray(value))
        return value
          .flatMap(v => v.split(","))
          .map(v => v.trim())
          .filter(Boolean);
      return undefined;
    };

    // Fetch Products
    const productsResult = await getAllProductsPublic({
      category: currentCategory,
      subcategory: currentSubcategory,
      query: searchQuery,
      designThemes: parseArray(resolvedSearchParams?.designThemes),
      onSale: parseBoolean(resolvedSearchParams?.onSale),
      isCustomizable: parseBoolean(resolvedSearchParams?.isCustomizable)
    });

    // Explicitly type the array as Product[]
    const initialProducts = productsResult.success ? (productsResult.data as Product[]) || [] : [];
    // Fetch Categories using the refactored service
    const categoriesRes = await adminCategoryService.getCategories();
    const categoriesToShow = categoriesRes.success ? categoriesRes.data.categories : [];

    return (
      <ProductsProvider
        initialProducts={initialProducts}
        currentCategory={currentCategory}
        currentSubcategory={currentSubcategory}
        searchQuery={searchQuery}>
        <main className="min-h-screen">
          <section className="py-16 w-full bg-secondary/5">
            <div className="container mx-auto px-4">
              <ProductsHeader />
              <CategoryCardsWrapper categories={categoriesToShow} selectedCategory={currentCategory ?? null} />
              <SubcategoryCardsWrapper parentCategory={currentCategory ?? null} />
            </div>
          </section>

          <section className="py-6 w-full bg-secondary/5 ">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                <aside className="hidden lg:block h-fit">
                  <div className="bg-background rounded-xl p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto shadow-sm border border-border/40">
                    <ProductFilters />
                  </div>
                </aside>
                <div>
                  <ProductsGrid />
                </div>
              </div>
            </div>
          </section>
        </main>
      </ProductsProvider>
    );
  } catch (error) {
    console.error("ProductsPage Error:", error);
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-destructive/10 text-destructive rounded-lg">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p>We encountered an error loading the products. Please try refreshing the page.</p>
        </div>
      </main>
    );
  }
};

export default ProductsPage;
