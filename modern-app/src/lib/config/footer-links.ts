/**
 * Configuration for footer links.
 * This structure defines the columns and the links within each.
 */
type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export const footerLinkConfig: FooterColumn[] = [
  {
    title: "For Customers",
    links: [
      { href: "/find-plumber", label: "Find a Plumber" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/emergency", label: "Emergency Jobs" },
      { href: "/resources", label: "Guides & Resources" },
      { href: "/services", label: "Services" }
    ]
  },
  {
    title: "For Plumbers",
    links: [
      { href: "/join-our-network", label: "Join Our Network" },
      { href: "/pricing", label: "Pricing" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact" },
      { href: "/sitemap", label: "Sitemap" }
    ]
  }
];
