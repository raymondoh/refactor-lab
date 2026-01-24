import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { PageHeader } from "@/components/shared/PageHeader";
import Image from "next/image"; // Keep if used in other parts of the page not shown
import { Mail } from "lucide-react"; // Keep if used
import Link from "next/link"; // Keep if used

import { ProductCarousel } from "@/components/shared/ProductCarousel"; // Your import for the carousel
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  title: `About Us - My Story & Our Craft | ${siteConfig.name}`,
  description: `Discover the passion and craftsmanship behind ${siteConfig.name} - your trusted source for premium custom stickers and decals.`,
  keywords: [
    "about motostix",
    "founder story",
    "sticker craftsmanship",
    "premium decals",
    "custom sticker company",
    "quality stickers"
  ],
  openGraph: {
    title: `About Us - My Story & Our Craft | ${siteConfig.name}`,
    description:
      "Discover the passion and craftsmanship behind MotoStix - your trusted source for premium custom stickers and decals.",
    type: "website",
    url: `${siteConfig.url}/about`,
    images: [
      {
        url: "/og-about.jpg",
        width: 1200,
        height: 630,
        alt: `About ${siteConfig.name}`
      }
    ],
    siteName: siteConfig.name
  },
  twitter: {
    card: "summary_large_image",
    title: `About Us | ${siteConfig.name}`,
    description:
      "Discover the passion and craftsmanship behind MotoStix - your trusted source for premium custom stickers and decals.",
    images: ["/og-about.jpg"],
    creator: "@motostix"
  },
  alternates: {
    canonical: `${siteConfig.url}/about`
  },
  robots: {
    index: true,
    follow: true
  }
};

const placeholderProducts: Product[] = [
  {
    id: "feat-1",
    name: "Bestselling Moto Sticker",
    image: "/images/hero-bg.jpg", // Ensure this image path is correct
    price: 7.99,
    onSale: false,
    category: "Motorbikes",
    //slug: "bestselling-moto-sticker", // Added slug, often useful
    inStock: true,
    averageRating: 4.8, // Assuming you want to include average rating
    reviewCount: 150, // Assuming you want to include review count
    createdAt: new Date().toISOString()
  },
  {
    id: "feat-2",
    name: "New Arrival Car Decal",
    image: "/images/hero-bg.jpg", // Ensure this image path is correct
    price: 9.5,
    onSale: true,
    salePrice: 8.0,
    category: "Cars",
    //slug: "new-arrival-car-decal", // Added slug
    averageRating: 4.5, // Assuming you want to include average rating
    reviewCount: 75, // Assuming you want to include review count
    inStock: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "feat-3",
    name: "Custom Design Example",
    image: "/images/hero-bg.jpg", // Ensure this image path is correct
    price: 6.25,
    onSale: false,
    category: "Other",
    //slug: "custom-design-example", // Added slug
    averageRating: 4.2, // Assuming you want to include average rating
    reviewCount: 50, // Assuming you want to include review count
    inStock: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "feat-4",
    name: "Limited Edition Sticker",
    image: "/images/hero-bg.jpg", // Ensure this image path is correct
    price: 12.0,
    onSale: false,
    category: "Motorbikes",
    //slug: "limited-edition-sticker", // Added slug
    averageRating: 4.9, // Assuming you want to include average rating
    reviewCount: 200, // Assuming you want to include review count
    inStock: true,
    createdAt: new Date().toISOString()
  }
];

// The RelatedProductsProps interface is not needed for the AboutPage component itself.
// If ProductCarousel needs its own props interface, it should be defined with that component.

export default function AboutPage() {
  // Removed props from here
  return (
    <main className="min-h-screen ">
      {/* Hero Section with PageHeader (remains centered) */}
      <section className="py-16 w-full bg-background">
        {" "}
        {/* Removed page-glow-container for now */}
        <div className="container mx-auto px-4">
          <PageHeader
            title="About MotoStix"
            subtitle="Driven by passion, crafted with precision. Discover the story behind your favorite stickers."
          />

          {/* Introduction / My Story Section (Now left-aligned content) */}
          <div className="max-w-4xl mx-auto mt-16">
            <article className="prose dark:prose-invert max-w-none">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="w-12 h-0.5 bg-primary mb-6"></div>
              <p>
                Hi, I'm [Your Name/Nickname], the founder and creative force behind MotoStix. What started in [Year] as
                a personal quest for the perfect [motorcycle/car] decal has grown into a passion for helping fellow
                enthusiasts express their individuality.
              </p>
              <p>
                As a rider myself, I understand the connection we have with our machines. They're more than just
                transport; they're an extension of our personality. That's why I pour my energy into creating
                high-quality, durable, and unique designs that resonate with the spirit of the ride. Every sticker is
                crafted with the same care and attention to detail I'd want for my own bike.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Our Craft / Process Section (Now left-aligned content) */}
      <section className="py-16 w-full bg-secondary/5 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Craft & Commitment</h2>
            <div className="w-12 h-0.5 bg-primary mb-6"></div>
            <article className="prose dark:prose-invert max-w-none">
              <p>
                At MotoStix, every decal begins with a love for design and a commitment to durability. I use only
                premium-grade vinyl and laminates, ensuring your stickers can withstand the elements – sun, rain, mud,
                and whatever else the road throws your way. My process focuses on precision cutting and vibrant,
                long-lasting colors, so your chosen design looks sharp for years to come. From initial concept to the
                final product, my goal is to deliver a sticker you'll be proud to display.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Values Section (Headings left-aligned) */}
      <section className="py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Core Values</h2>
            <div className="w-12 h-0.5 bg-primary mb-6"></div>
            <p className="text-muted-foreground mb-12 max-w-2xl">
              The principles that guide everything I do at MotoStix.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Uncompromising Quality",
                description:
                  "I use only premium vinyl and materials designed for durability against weather and UV exposure."
              },
              {
                title: "Rider Focused",
                description: "Designs born from a passion for riding, ensuring they resonate with the community."
              },
              {
                title: "Creative Expression",
                description: "Constantly exploring new designs and techniques to help you make your mark."
              }
            ].map((value, index) => (
              <div key={index} className="bg-background rounded-xl p-6 shadow-sm border border-border/40">
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <div className="w-8 h-0.5 bg-primary mb-4"></div>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section className="py-16 w-full  border-y border-border/40">
        <div className="container mx-auto px-4">
          {/* <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Some of Our Work</h2>
            <div className="w-12 h-0.5 bg-primary mb-12"></div> 
          </div> */}
          <ProductCarousel
            products={placeholderProducts} // Use the locally defined placeholderProducts
            title="Featured Products" // This title might be redundant if you have the h2 above
            description="Explore our premium selection of custom stickers." // This also might be redundant
            viewAllUrl="/products"
            // centered={true} // ProductCarousel likely handles its own centering/layout
          />
        </div>
      </section>

      {/* Simplified Contact Section (Left-aligned) */}
      <section className="py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Get In Touch</h2>
            <div className="w-12 h-0.5 bg-primary mb-6"></div>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Have questions, a custom request, or just want to talk stickers? I'd love to hear from you.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:info@motostix.com" className="text-muted-foreground hover:text-primary">
                  info@motostix.com
                </a>
              </div>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Or, send a message through our{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    Contact Page
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
