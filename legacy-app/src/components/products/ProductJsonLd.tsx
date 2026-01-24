import type { Product } from "@/types/product";

interface ProductJsonLdProps {
  product: Product;
  url: string;
}

export function ProductJsonLd({ product, url }: ProductJsonLdProps) {
  // Create the structured data object
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.image || "",
    description: product.description || "",
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "MotoStix"
    },
    offers: {
      "@type": "Offer",
      url: url,
      priceCurrency: "GBP",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "MotoStix"
      }
    }
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
