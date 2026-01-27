// src/app/(root)/products/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { ProductsProvider } from "@/components/products/ProductsProvider";
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductFilters } from "@/components/products/filters/ProductFilters";
import { CategoryCardsWrapper } from "@/components/products/category-carousel/CategoryCardsWrapper";
import { SubcategoryCardsWrapper } from "@/components/products/subcategory-carousel/SubcategoryCardsWrapper";
import { adminProductService } from "@/lib/services/admin-product-service";

// ✅ NEW: service-layer categories
import { adminCategoryService } from "@/lib/services/admin-category-service";

import {
  type CategoryData,
  categoriesToData as convertCategoryNamesToData,
  type Category as CategoryNameType
} from "@/config/categories";

export const metadata: Metadata = {
  title: `Products - ${siteConfig.name}`,
  description:
    "Browse our complete collection of high-quality custom stickers. From vinyl decals to waterproof labels, find the perfect stickers for any surface or occasion.",
  keywords: [
    "custom stickers",
    "vinyl stickers",
    "waterproof stickers",
    "decals",
    "labels",
    "custom decals",
    "personalized stickers",
    "sticker collection"
  ],
  openGraph: {
    title: `Products - ${siteConfig.name}`,
    description:
      "Browse our complete collection of high-quality custom stickers. From vinyl decals to waterproof labels, find the perfect stickers for any surface or occasion.",
    type: "website",
    url: `${siteConfig.url}/products`,
    images: [
      {
        url: "/og-products.jpg",
        width: 1200,
        height: 630,
        alt: "MotoStix Products Collection"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `Products - ${siteConfig.name}`,
    description:
      "Browse our complete collection of high-quality custom stickers. From vinyl decals to waterproof labels, find the perfect stickers for any surface or occasion.",
    images: ["/og-products.jpg"]
  },
  alternates: {
    canonical: `${siteConfig.url}/products`
  }
};

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

interface ProductsPageProps {
  params: Promise<{ slug?: string }>;
  searchParams: SearchParams;
}

function isCategoryData(item: unknown): item is CategoryData {
  return (
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    "name" in item &&
    typeof (item as CategoryData).id === "string" &&
    typeof (item as CategoryData).name === "string"
  );
}

function isCategoryName(item: unknown): item is CategoryNameType {
  return typeof item === "string" && ["Cars", "Motorbikes", "Bicycles", "EVs", "Other"].includes(item as string);
}

function processCategoriesData(data: unknown[]): CategoryData[] {
  if (data.length === 0) return [];

  const allAreCategoryData = data.every(isCategoryData);
  if (allAreCategoryData) return data as CategoryData[];

  const allAreCategoryNames = data.every(isCategoryName);
  if (allAreCategoryNames) return convertCategoryNamesToData(data as CategoryNameType[]);

  const categoryDataItems = data.filter(isCategoryData);
  const categoryNameItems = data.filter(isCategoryName);

  if (categoryDataItems.length > 0 && categoryNameItems.length === 0) return categoryDataItems;
  if (categoryDataItems.length === 0 && categoryNameItems.length > 0)
    return convertCategoryNamesToData(categoryNameItems);

  if (categoryDataItems.length > 0 && categoryNameItems.length > 0) {
    console.warn("Mixed category types found, combining both types");
    const convertedNames = convertCategoryNamesToData(categoryNameItems);
    return [...categoryDataItems, ...convertedNames];
  }

  return [];
}

const ProductsPage = async ({ searchParams }: ProductsPageProps) => {
  try {
    const resolvedSearchParams = await searchParams;

    const currentCategory =
      typeof resolvedSearchParams?.category === "string" ? resolvedSearchParams.category.toLowerCase() : undefined;

    const currentSubcategory =
      typeof resolvedSearchParams?.subcategory === "string"
        ? resolvedSearchParams.subcategory.toLowerCase()
        : undefined;

    const searchQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : undefined;

    const parseBoolean = (value: string | string[] | undefined): boolean | undefined => {
      if (typeof value === "string") return value === "true";
      if (Array.isArray(value)) return value[0] === "true";
      return undefined;
    };

    const parseArray = (value: string | string[] | undefined): string[] | undefined => {
      if (typeof value === "string") {
        return value
          .split(",")
          .map(v => v.trim())
          .filter(v => v.length > 0);
      }
      if (Array.isArray(value)) {
        return value
          .flatMap(v => v.split(","))
          .map(v => v.trim())
          .filter(v => v.length > 0);
      }
      return undefined;
    };

    const designThemes = parseArray(resolvedSearchParams?.designThemes);
    const onSale = parseBoolean(resolvedSearchParams?.onSale);
    const isCustomizable = parseBoolean(resolvedSearchParams?.isCustomizable);

    const productsResult = await adminProductService.getAllProducts({
      category: currentCategory,
      subcategory: currentSubcategory,
      query: searchQuery,
      designThemes,
      onSale,
      isCustomizable
    });

    const initialProducts = productsResult.success ? productsResult.data || [] : [];

    if (initialProducts.length === 0 && (currentCategory || currentSubcategory || searchQuery)) {
      console.warn("ProductsPage - WARNING: getAllProducts returned no items for the selected criteria:", {
        category: currentCategory,
        subcategory: currentSubcategory,
        query: searchQuery
      });
    }

    // ✅ UPDATED: Fetch and process categories from adminCategoryService
    let categoriesToShow: CategoryData[] = [];

    try {
      const res = await adminCategoryService.getCategories();

      if (!res.success) {
        console.error("ProductsPage - Error fetching categories:", res.error);
        categoriesToShow = [];
      } else {
        const raw = res.data.categories;

        if (Array.isArray(raw)) {
          categoriesToShow = processCategoriesData(raw as unknown[]);
        } else {
          categoriesToShow = [];
        }
      }
    } catch (error) {
      console.error("ProductsPage - Exception fetching/processing categories:", error);
      categoriesToShow = [];
    }

    return (
      <ProductsProvider
        initialProducts={initialProducts}
        currentCategory={currentCategory}
        currentSubcategory={currentSubcategory}
        searchQuery={searchQuery}>
        <main className="min-h-screen">
          <section className="py-16 w-full bg-background">
            <div className="container mx-auto px-4">
              <ProductsHeader />
              <CategoryCardsWrapper categories={categoriesToShow} selectedCategory={currentCategory ?? null} />
              <SubcategoryCardsWrapper parentCategory={currentCategory ?? null} />
            </div>
          </section>

          <section className="py-10 w-full bg-secondary/5 border-y border-border/40">
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
    console.error("ProductsPage - Unhandled exception:", error);

    return (
      <main className="min-h-screen">
        <section className="py-16 w-full bg-background">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-4">Products</h1>
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
              An error occurred while loading products. Please try again later.
            </div>
          </div>
        </section>
      </main>
    );
  }
};

export default ProductsPage;
