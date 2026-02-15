// src/app/(root)/products/[slugId]/page.tsx

import { notFound, redirect } from "next/navigation"; // Added redirect
import { getRelatedProducts, getPublicProductById as getProductById } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProductJsonLd } from "@/components/products/ProductJsonLd";
import { ProductGallery, ProductInfo, ProductTabs, RelatedProducts } from "@/components/products/page-detail";
import type { Metadata, ResolvingMetadata } from "next";
import { siteConfig } from "@/config/siteConfig";

// Combined imports from your consolidated library
import { extractProductId, getProductHref, isCanonicalProductSlug } from "@/lib/urls/product-url";

// ---------- Metadata ----------
interface MetadataProps {
  params: Promise<{ slugId: string }>;
}

export async function generateMetadata(props: MetadataProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { slugId } = await props.params;
  const id = extractProductId(slugId);

  const result = await getProductById(id);

  if (!result.ok) {
    return {
      title: "Product Not Found | MotoStix",
      description: "The requested product could not be found."
    };
  }

  const { product } = result.data;
  const previousImages = (await parent).openGraph?.images || [];
  const productUrl = `${siteConfig.url}${getProductHref(product)}`;

  const baseDescription = product.description || `High-quality ${product.name} sticker from MotoStix`;
  const enhancedDescription = `${baseDescription}${product.category ? ` | ${product.category} category` : ""}${
    product.price ? ` | Starting at $${product.price}` : ""
  } | Fast shipping & premium quality guaranteed.`;

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
interface ProductPageProps {
  params: Promise<{ slugId: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slugId } = await params;
  const id = extractProductId(slugId);

  const result = await getProductById(id);

  if (!result.ok) {
    notFound();
  }

  const { product } = result.data;

  // ✅ SEO Protection: Redirect if the slug part of the URL is non-canonical
  // Example: /products/old-name--abc123 -> /products/new-name--abc123
  if (!isCanonicalProductSlug(slugId, product)) {
    redirect(getProductHref(product));
  }

  const productUrl = `${siteConfig.url}${getProductHref(product)}`;

  const relatedResult = await getRelatedProducts({
    productId: product.id,
    category: product.category,
    limit: 4
  });

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
              </Link>
              {" / "}
              <Link href="/products" className="hover:text-foreground">
                Products
              </Link>
              {product.category && (
                <>
                  {" / "}
                  <Link
                    href={`/products?category=${String(product.category).toLowerCase()}`}
                    className="hover:text-foreground">
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
