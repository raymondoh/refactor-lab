// src/app/(root)/products/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { ProductsProvider } from "@/components/products/ProductsProvider";
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductFilters } from "@/components/products/filters/ProductFilters";
import { CategoryCardsWrapper } from "@/components/products/category-carousel/CategoryCardsWrapper";
import { SubcategoryCardsWrapper } from "@/components/products/subcategory-carousel/SubcategoryCardsWrapper";
import { getAllProducts } from "@/firebase/admin/products";
import { getCategories } from "@/firebase/admin/categories";
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
        url: "/og-products.jpg", // You'll want to create this image
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

// Define the correct type for Next.js App Router searchParams
type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

// Update the page props interface to match Next.js 15 conventions
interface ProductsPageProps {
  params: Promise<{ slug?: string }>;
  searchParams: SearchParams;
}

// Type guard to check if an item is a CategoryData object
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

// Type guard to check if an item is a category name string
function isCategoryName(item: unknown): item is CategoryNameType {
  return typeof item === "string" && ["Cars", "Motorbikes", "Bicycles", "EVs", "Other"].includes(item as string);
}

// Helper function to safely process categories data
function processCategoriesData(data: unknown[]): CategoryData[] {
  if (data.length === 0) {
    return [];
  }

  // Check if all items are CategoryData objects
  const allAreCategoryData = data.every(isCategoryData);
  if (allAreCategoryData) {
    return data as CategoryData[];
  }

  // Check if all items are category name strings
  const allAreCategoryNames = data.every(isCategoryName);
  if (allAreCategoryNames) {
    return convertCategoryNamesToData(data as CategoryNameType[]);
  }

  // Handle mixed array - filter and process separately
  const categoryDataItems = data.filter(isCategoryData);
  const categoryNameItems = data.filter(isCategoryName);

  if (categoryDataItems.length > 0 && categoryNameItems.length === 0) {
    // Only CategoryData items found
    return categoryDataItems;
  } else if (categoryDataItems.length === 0 && categoryNameItems.length > 0) {
    // Only category name strings found
    return convertCategoryNamesToData(categoryNameItems);
  } else if (categoryDataItems.length > 0 && categoryNameItems.length > 0) {
    // Mixed types - prefer CategoryData objects, but convert names too
    console.warn("Mixed category types found, combining both types");
    const convertedNames = convertCategoryNamesToData(categoryNameItems);
    return [...categoryDataItems, ...convertedNames];
  } else {
    // No valid items found
    console.warn("No valid category items found in data:", data);
    return [];
  }
}

const ProductsPage = async ({ searchParams }: ProductsPageProps) => {
  try {
    // Await searchParams before accessing properties (Next.js 15 requirement)
    const resolvedSearchParams = await searchParams;

    // Extract and normalize category and subcategory from searchParams
    const currentCategory =
      typeof resolvedSearchParams?.category === "string" ? resolvedSearchParams.category.toLowerCase() : undefined;

    const currentSubcategory =
      typeof resolvedSearchParams?.subcategory === "string"
        ? resolvedSearchParams.subcategory.toLowerCase()
        : undefined;

    // NEW: Extract the 'q' (search query) parameter
    const searchQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : undefined;

    // Extract additional filter parameters
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

    console.log(
      "ProductsPage - Render. currentCategory from URL:",
      currentCategory,
      "currentSubcategory from URL:",
      currentSubcategory,
      "searchQuery from URL:",
      searchQuery,
      "designThemes from URL:",
      designThemes,
      "onSale from URL:",
      onSale,
      "isCustomizable from URL:",
      isCustomizable
    );

    // Fetch initial products
    // NEW: Pass the searchQuery to getAllProducts
    const productsResult = await getAllProducts({
      category: currentCategory,
      subcategory: currentSubcategory,
      query: searchQuery,
      designThemes,
      onSale,
      isCustomizable
    });

    const initialProducts = productsResult.success ? productsResult.data || [] : [];

    if (!productsResult.success) {
      console.error("ProductsPage - Error fetching initial products:", productsResult.error);
    }

    console.log("ProductsPage - initialProducts count after getAllProducts:", initialProducts.length);

    if (initialProducts.length === 0 && (currentCategory || currentSubcategory || searchQuery)) {
      console.warn("ProductsPage - WARNING: getAllProducts returned no items for the selected criteria:", {
        category: currentCategory,
        subcategory: currentSubcategory,
        query: searchQuery // NEW: Include query in warning
      });
    }

    // Fetch and process categories with improved type handling
    let categoriesToShow: CategoryData[] = [];

    try {
      const categoriesResult = await getCategories();

      if (categoriesResult?.success && categoriesResult.data) {
        const data = categoriesResult.data;

        if (Array.isArray(data)) {
          categoriesToShow = processCategoriesData(data);
        } else {
          console.warn("ProductsPage - getCategories data is not an array:", data);
          categoriesToShow = [];
        }
      } else {
        console.error("ProductsPage - Error from getCategories:", categoriesResult?.error || "Unknown error");
        categoriesToShow = [];
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
        searchQuery={searchQuery} // NEW: Pass the search query to ProductsProvider
      >
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

    // Return a minimal error UI
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
