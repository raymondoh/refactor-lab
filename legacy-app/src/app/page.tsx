// legacy-app/src/app/page.tsx
import type { Metadata } from "next";
import { HeroBanner } from "@/components/homepage-sections/HeroBanner";
import { siteConfig } from "@/config/siteConfig";
import { CategoriesStatic } from "@/components/homepage-sections/CategoriesStatic";
import { TestimonialSection } from "@/components/homepage-sections/TestimonialSection";
import { PromoSection } from "@/components/homepage-sections/PromoSection";
import StickerGridSectionsStatic from "@/components/homepage-sections/StickerGridSectionStatic";
import { serializeProductArray } from "@/utils/serializeProduct";
import { ProductCarousel } from "@/components/shared/ProductCarousel";
import { Product } from "@/types/models/product";
import { getAllProductsPublic } from "@/lib/services/products-public-service";

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

export default async function HomePage() {
  console.log("🏠 Homepage - Starting data fetch at:", new Date().toISOString());

  // Fetch all the different product collections
  const [featuredRes, trendingRes, saleRes, newRes, themedRes] = await Promise.all([
    getAllProductsPublic({ isFeatured: true, limit: 8 }),
    getAllProductsPublic({ limit: 8 }), // trending fallback = latest
    getAllProductsPublic({ onSale: true, limit: 6 }),
    getAllProductsPublic({ isNewArrival: true, limit: 6 }),
    getAllProductsPublic({ themedOnly: true, limit: 8 })
  ]);

  const featuredProducts = featuredRes.success ? serializeProductArray(featuredRes.data as Product[]) : [];
  const trendingProducts = trendingRes.success ? serializeProductArray(trendingRes.data as Product[]) : [];
  const saleProducts = saleRes.success ? serializeProductArray(saleRes.data as Product[]) : [];
  const newArrivals = newRes.success ? serializeProductArray(newRes.data as Product[]) : [];
  const themedProducts = themedRes.success ? serializeProductArray(themedRes.data as Product[]) : [];
  // Fix the console logs as well (accessing .length directly on the serialized array)
  console.log("🏠 Featured products count:", featuredProducts.length);
  console.log("🏠 Sale products count:", saleProducts.length);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Featured Categories */}
        <CategoriesStatic />

        {/* Featured Products */}
        {trendingProducts.length > 0 && (
          <ProductCarousel
            products={trendingProducts}
            title="Trending Stickers"
            description="Standout picks hand-chosen by our team"
            viewAllUrl="/products?isFeatured=true"
            centered={false}
          />
        )}

        {/* 1. TRENDING PRODUCTS */}
        {trendingProducts.length > 0 && (
          <ProductCarousel
            products={trendingProducts}
            title="Trending Stickers"
            description="Discover the most popular designs loved by our community"
            viewAllUrl="/products?sort=trending"
            centered={false}
          />
        )}

        {/* Sticker Grid Sections */}
        <StickerGridSectionsStatic />

        {/* 2. SALE CAROUSEL */}
        {saleProducts.length > 0 && (
          <>
            {console.log("Rendering DEDICATED Sale Carousel with", saleProducts.length)}
            <ProductCarousel
              products={saleProducts}
              title="Special Offers"
              description="Limited-time deals on premium stickers!"
              viewAllUrl="/products?onSale=true"
              centered={false}
            />
          </>
        )}

        {/* 3. NEW ARRIVALS CAROUSEL - Only shows if there are new arrivals */}
        {/* 3. NEW ARRIVALS CAROUSEL */}
        {newArrivals.length > 0 && (
          <ProductCarousel
            products={newArrivals}
            title="New Arrivals"
            description="Fresh designs just added to our collection"
            viewAllUrl="/products?isNewArrival=true"
            centered={false}
          />
        )}

        {/* 4. DESIGNER COLLECTION CAROUSEL - Only shows if there are themed products */}
        {themedProducts.length > 0 && (
          <ProductCarousel
            products={themedProducts}
            title="Designer Collection"
            description="Curated designs featuring our most popular themes"
            viewAllUrl="/products?designThemes=featured"
            centered={false}
          />
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
