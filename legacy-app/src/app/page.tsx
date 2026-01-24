import type { Metadata } from "next";
import { HeroBanner } from "@/components/homepage-sections/HeroBanner";
import { siteConfig } from "@/config/siteConfig";
import { CategoriesStatic } from "@/components/homepage-sections/CategoriesStatic";
import { TestimonialSection } from "@/components/homepage-sections/TestimonialSection";
import { PromoSection } from "@/components/homepage-sections/PromoSection";
import StickerGridSectionsStatic from "@/components/homepage-sections/StickerGridSectionStatic";
import { ProductCarousel } from "@/components/shared/ProductCarousel";
import {
  getAllProducts,
  getOnSaleProducts,
  getNewArrivals
} from "@/firebase/admin/products";
import { getDesignThemes } from "@/firebase/admin/categories";

// Force dynamic rendering to get fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: `${siteConfig.name} - Main Value Proposition`,
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} - Main Value Proposition`,
    description: siteConfig.description,
    type: "website"
  }
};

// Helper function to get themed products
async function getThemedProducts(limit = 6) {
  try {
    const themesResult = await getDesignThemes();
    if (!themesResult.success || !themesResult.data || themesResult.data.length === 0) {
      return { success: false, data: [] };
    }

    const popularThemes = themesResult.data.slice(0, 5);
    const result = await getAllProducts({
      designThemes: popularThemes,
      limit: limit
    });

    return result;
  } catch (error) {
    console.error("Error fetching themed products:", error);
    return { success: false, data: [] };
  }
}

export default async function HomePage() {
  console.log(
    "🏠 Homepage - Starting data fetch at:",
    new Date().toISOString()
  );

  // Fetch all the different product collections
  const [featuredProducts, trendingProducts, saleProducts, newArrivals, themedProducts] =
    await Promise.all([
      getAllProducts({ isFeatured: true, limit: 8 }),
      getAllProducts({ limit: 8 }),
      getOnSaleProducts(6),
      getNewArrivals(6),
      getThemedProducts(8)
    ]);

  console.log("🏠 Homepage - Data fetch completed");
  console.log(
    "🏠 Featured products:",
    featuredProducts.success ? featuredProducts.data.length : 0
  );
  console.log(
    "🏠 Trending products:",
    trendingProducts.success ? trendingProducts.data.length : 0
  );
  console.log(
    "🏠 Sale products:",
    saleProducts.success ? saleProducts.data.length : 0
  );
  console.log(
    "🏠 New arrivals:",
    newArrivals.success ? newArrivals.data.length : 0
  );
  console.log(
    "🏠 Themed products:",
    themedProducts.success ? themedProducts.data.length : 0
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Featured Categories */}
        <CategoriesStatic />

        {/* Featured Products */}
        {featuredProducts.success && featuredProducts.data.length > 0 && (
          <ProductCarousel
            products={featuredProducts.data}
            title="Featured Products"
            description="Standout picks hand-chosen by our team"
            viewAllUrl="/products?isFeatured=true"
            centered={false}
          />
        )}

        {/* 1. TRENDING PRODUCTS - Always show if available */}
        {trendingProducts.success && trendingProducts.data.length > 0 && (
          <ProductCarousel
            products={trendingProducts.data}
            title="Trending Stickers"
            description="Discover the most popular designs loved by our community"
            viewAllUrl="/products?sort=trending"
            centered={false}
          />
        )}

        {/* Sticker Grid Sections */}
        <StickerGridSectionsStatic />

        {/* 2. SALE CAROUSEL - Only shows if there are actual sale products */}
        {saleProducts.success && saleProducts.data.length > 0 && (
          <>
            {console.log("🏠 Rendering DEDICATED Sale Carousel with", saleProducts.data.length, "products")}
            <ProductCarousel
              products={saleProducts.data}
              title="Special Offers"
              description="Limited-time deals on premium stickers - grab them while they last!"
              viewAllUrl="/products?onSale=true"
              centered={false}
            />
          </>
        )}

        {/* 3. NEW ARRIVALS CAROUSEL - Only shows if there are new arrivals */}
        {newArrivals.success && newArrivals.data.length > 0 && (
          <>
            {console.log("🏠 Rendering New Arrivals Carousel with", newArrivals.data.length, "products")}
            <ProductCarousel
              products={newArrivals.data}
              title="New Arrivals"
              description="Fresh designs just added to our collection"
              viewAllUrl="/products?isNewArrival=true"
              centered={false}
            />
          </>
        )}

        {/* 4. DESIGNER COLLECTION CAROUSEL - Only shows if there are themed products */}
        {themedProducts.success && themedProducts.data.length > 0 && (
          <>
            {console.log("🏠 Rendering Designer Collection Carousel with", themedProducts.data.length, "products")}
            <ProductCarousel
              products={themedProducts.data}
              title="Designer Collection"
              description="Curated designs featuring our most popular themes"
              viewAllUrl="/products?designThemes=featured"
              centered={false}
            />
          </>
        )}

        {/* 5. STAFF PICKS CAROUSEL - Fallback if nothing else shows */}
        {/* Uncomment this if you want a guaranteed fallback carousel */}
        {/*
        {(!saleProducts.success || saleProducts.data.length === 0) &&
         (!newArrivals.success || newArrivals.data.length === 0) &&
         (!themedProducts.success || themedProducts.data.length === 0) &&
         featuredProducts.success && featuredProducts.data.length > 4 && (
          <>
            {console.log("🏠 Rendering Fallback Staff Picks Carousel")}
            <ProductCarousel
              products={featuredProducts.data.slice(4, 8)}
              title="Staff Picks"
              description="Hand-selected favorites from our design team"
              viewAllUrl="/products?featured=true"
              centered={false}
            />
          </>
        )}
        */}

        {/* Testimonials */}
        <TestimonialSection />

        {/* Promo Section */}
        <PromoSection />
      </main>
    </div>
  );
}
