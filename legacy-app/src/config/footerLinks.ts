// src/config/footerLinks.ts

export interface FooterLink {
  name: string;
  href: string;
}

// Links for the "Shop" column
export const footerShopLinks: FooterLink[] = [
  { name: "Motorbikes", href: "/products?category=motorbikes" },
  { name: "Cars", href: "/products?category=cars" },
  { name: "Bicycles", href: "/products?category=bicycles" },
  { name: "Custom Designs", href: "/products?category=other&subcategory=custom" },
  { name: "All Products", href: "/products" }
];

// Links for the bottom bar (legal/policies)
export const footerPolicyLinks: FooterLink[] = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Service", href: "/terms-of-service" },
  { name: "Shipping Policy", href: "/shipping-policy" },
  { name: "Returns & Refunds", href: "/returns-policy" }
];

// You can also centralize your social media links
export const socialLinks: FooterLink[] = [
  { name: "Facebook", href: "#" }, // Replace '#' with your actual URLs
  { name: "Instagram", href: "#" },
  { name: "Twitter", href: "#" },
  { name: "Youtube", href: "#" }
];
