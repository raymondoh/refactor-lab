// src/app/(root)/products/[id]/page.tsx

import { notFound } from "next/navigation";
import { getRelatedProducts } from "@/actions/products";
import { getPublicProductById as getProductById } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProductJsonLd } from "@/components/products/ProductJsonLd";
import { ProductGallery, ProductInfo, ProductTabs, RelatedProducts } from "@/components/products/page-detail";
import type { Metadata, ResolvingMetadata } from "next";
import { siteConfig } from "@/config/siteConfig";

// ---------- Metadata ----------
interface MetadataProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: MetadataProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { id } = await props.params;

  const result = await getProductById(id);

  // FIX: In the new ServiceResult shape, we check result.ok
  // and the data payload is inside result.data
  if (!result.ok) {
    return {
      title: "Product Not Found | MotoStix",
      description: "The requested product could not be found."
    };
  }

  const { product } = result.data;
  const previousImages = (await parent).openGraph?.images || [];

  const baseDescription = product.description || `High-quality ${product.name} sticker from MotoStix`;
  const enhancedDescription = `${baseDescription}${product.category ? ` | ${product.category} category` : ""}${
    product.price ? ` | Starting at $${product.price}` : ""
  } | Fast shipping & premium quality guaranteed.`;

  const productUrl = `${siteConfig.url}/products/${product.id}`;

  return {
    title: `${product.name} - Premium Custom Stickers | ${siteConfig.name}`,
    description: enhancedDescription.substring(0, 160),
    openGraph: {
      title: `${product.name} | ${siteConfig.name}`,
      description: enhancedDescription.substring(0, 200),
      url: productUrl,
      images: product.image ? [{ url: product.image, width: 1200, height: 630 }] : previousImages
    },
    alternates: { canonical: productUrl }
  };
}

// ---------- Page ----------
// Define the specific interface for this page's props
interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  console.log("Fetching product with ID:", id);

  const result = await getProductById(id);

  // FIX: Ensure we check result.ok. Once true, TS knows result.data exists.
  if (!result.ok) {
    console.error("Fetch failed because:", result.error);
    notFound();
  }

  const { product } = result.data;
  const productUrl = `${siteConfig.url}/products/${product.id}`;

  const relatedResult = await getRelatedProducts({
    productId: product.id,
    category: product.category,
    limit: 4
  });

  // FIX: Unpack related products array from relatedResult.data
  const relatedProducts = relatedResult.ok ? relatedResult.data.products : [];

  return (
    <main className="min-h-screen">
      <ProductJsonLd product={product} url={productUrl} />

      <section className="py-12 md:py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="text-sm text-muted-foreground mb-3">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>{" "}
              /{" "}
              <Link href="/products" className="hover:text-foreground">
                Products
              </Link>
              {product.category && (
                <>
                  {" "}
                  /{" "}
                  <Link href={`/products?category=${product.category.toLowerCase()}`} className="hover:text-foreground">
                    {product.category}
                  </Link>
                </>
              )}
            </div>
            <Button variant="outline" asChild className="rounded-full">
              <Link href="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <ProductGallery product={product} />
            <ProductInfo product={product} />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 w-full bg-secondary/5 border-y border-border/40">
        <div className="container mx-auto px-4">
          <ProductTabs product={product} />
        </div>
      </section>

      {/* FIX: Simplified conditional rendering for Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12 md:py-16 w-full bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">You May Also Like</h2>
            <RelatedProducts products={relatedProducts} />
          </div>
        </section>
      )}
    </main>
  );
}
