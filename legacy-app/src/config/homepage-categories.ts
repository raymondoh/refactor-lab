import type { CategoryData } from "@/config/categories";

// Static category data specifically for homepage use
// This avoids Firebase calls and gives you full control over presentation
export const homepageFeaturedCategories: CategoryData[] = [
  {
    id: "cars",
    name: "Cars",
    count: 25, // You can use approximate counts or remove count display
    image: "/images/categories/cars-featured.jpg",
    icon: "car"
  },
  {
    id: "motorbikes",
    name: "Motorbikes",
    count: 200,
    image: "/images/categories/motorbikes-featured.jpg",
    icon: "bike"
  },
  {
    id: "evs",
    name: "EVs",
    count: 75,
    image: "/images/categories/evs-featured.jpg",
    icon: "zap"
  },
  {
    id: "bicycles",
    name: "Bicycles",
    count: 120,
    image: "/images/categories/bike-featured.jpg",
    icon: "bike"
  }
];

// Static grid sections data to avoid category lookups
export const stickerGridSections = {
  carSection: {
    id: "cars",
    name: "Cars",
    url: "/products?category=cars",
    image: "/car.jpg"
  },
  bikeSection: {
    id: "motorbikes",
    name: "Motorbikes",
    url: "/products?category=motorbikes",
    image: "/bike.jpg"
  },
  customSection: {
    id: "custom",
    name: "Custom Designs",
    url: "/products?isCustomizable=true",
    image: "/bike.jpg"
  },
  vintageSection: {
    id: "vintage",
    name: "Vintage Collection",
    url: "/products?designThemes=Vintage",
    image: "/car.jpg"
  }
};

// Curated product IDs for homepage carousels (you can update these periodically)
export const homepageProductCurations = {
  featured: [
    // Add specific product IDs you want to feature
    "product-id-1",
    "product-id-2",
    "product-id-3"
    // etc.
  ],
  trending: [
    // Add specific product IDs for trending section
    "trending-id-1",
    "trending-id-2"
    // etc.
  ],
  bikeCollection: [
    // Add specific bike-related product IDs
    "bike-product-1",
    "bike-product-2"
    // etc.
  ]
};
