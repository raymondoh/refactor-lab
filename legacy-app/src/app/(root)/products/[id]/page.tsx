// // src/app/(root)/products/[id]/page.tsx
//                 question: "What materials are used for your stickers?",
//                 answer:
//                   "Our stickers are made from high-quality vinyl that is durable, waterproof, and UV-resistant, ensuring they last for years without fading or peeling."
//               },

//                 answer:
//                   "Yes, we offer custom sticker designs. You can provide your artwork or ideas, and our design team will help bring your vision to life."
import { notFound } from "next/navigation";
import { getProductById, getRelatedProducts } from "@/actions/products";
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
  const params = await props.params;
  const id = params.id;

  const result = await getProductById(id);
  if (!result.success || !("product" in result) || !result.product) {
    return {
      title: "Product Not Found | MotoStix",
      description: "The requested product could not be found.",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const product = result.product;
  const previousImages = (await parent).openGraph?.images || [];

  // Create rich description
  const baseDescription = product.description || `High-quality ${product.name} sticker from MotoStix`;
  const enhancedDescription = `${baseDescription}${product.category ? ` | ${product.category} category` : ""}${
    product.price ? ` | Starting at $${product.price}` : ""
  } | Fast shipping & premium quality guaranteed.`;

  // Generate keywords based on product data
  const productKeywords = [
    product.name.toLowerCase(),
    ...(product.category ? [product.category.toLowerCase(), `${product.category.toLowerCase()} stickers`] : []),
    "custom stickers",
    "vinyl stickers",
    "waterproof stickers",
    "high quality stickers",
    "motostix"
  ];

  const productUrl = `${siteConfig.url}/products/${product.id}`;

  return {
    title: `${product.name} - Premium Custom Stickers | ${siteConfig.name}`,
    description: enhancedDescription.substring(0, 160), // Keep under 160 chars for SEO
    keywords: productKeywords,

    openGraph: {
      title: `${product.name} | ${siteConfig.name}`,
      description: enhancedDescription.substring(0, 200),
      type: "website", // Changed from "product" to "website"
      url: productUrl,
      images: product.image
        ? [
            {
              url: product.image,
              width: 1200,
              height: 630,
              alt: `${product.name} - Custom Sticker by MotoStix`
            }
          ]
        : previousImages,
      siteName: siteConfig.name
    },

    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${siteConfig.name}`,
      description: enhancedDescription.substring(0, 200),
      images: product.image ? [product.image] : [],
      creator: "@motostix" // Replace with your actual Twitter handle
    },

    alternates: {
      canonical: productUrl
    },

    // Additional metadata for better SEO
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1
      }
    },

    // Product-specific metadata using other field
    other: {
      "product:price:amount": product.price?.toString() || "",
      "product:price:currency": "USD",
      "product:availability": product.inStock ? "in stock" : "out of stock",
      "product:condition": "new",
      "product:retailer_item_id": product.id
    }
  };
}

// ---------- Page ----------
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  // Await the params object before accessing its properties
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const result = await getProductById(id);
  if (!result.success || !("product" in result) || !result.product) {
    notFound();
  }

  const product = result.product;
  const productUrl = `${siteConfig.url}/products/${product.id}`;

  const relatedProductsResult = await getRelatedProducts({
    productId: product.id,
    category: product.category,
    limit: 4
  });

  return (
    <main className="min-h-screen">
      {/* Structured Data */}
      <ProductJsonLd product={product} url={productUrl} />

      {/* Product Detail Section */}
      <section className="py-12 md:py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          {/* Breadcrumb + Back */}
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
                  {" / "}
                  <Link
                    href={`/products?category=${product.category.toLowerCase().replace(/\s+/g, "-")}`}
                    className="hover:text-foreground">
                    {product.category}
                  </Link>
                </>
              )}
            </div>

            <Button variant="outline" asChild className="rounded-full">
              <Link href="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Link>
            </Button>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <ProductGallery product={product} />
            <ProductInfo product={product} />
          </div>
        </div>
      </section>

      {/* Product Details Tabs Section */}
      <section className="py-12 md:py-16 w-full bg-secondary/5 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">Product Details</h2>
            <div className="w-12 h-0.5 bg-primary mb-6"></div>
          </div>

          <div className="max-w-4xl mx-auto">
            <ProductTabs product={product} />
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProductsResult.success &&
        "products" in relatedProductsResult &&
        relatedProductsResult.products &&
        relatedProductsResult.products.length > 0 && (
          <section className="py-12 md:py-16 w-full bg-background">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">You May Also Like</h2>
                <div className="w-12 h-0.5 bg-primary mb-6"></div>
              </div>

              <RelatedProducts products={relatedProductsResult.products} />
            </div>
          </section>
        )}
    </main>
  );
}
