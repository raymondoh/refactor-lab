// src/lib/dashboard/quick-links.ts
import { allDashboardLinks } from "@/components/dashboard/dashboard-sidebar";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/lib/auth/roles";

export interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const descriptionByHref: Record<string, string> = {
  "/dashboard/customer/jobs": "Track the status of all your posted jobs and view quotes.",
  "/dashboard/customer/profile": "Keep your contact and address information up to date.",
  "/dashboard/tradesperson/job-board": "Find new opportunities and quote on available jobs in your area.",
  "/dashboard/tradesperson/my-quotes": "View and manage all the quotes you have submitted.",
  "/dashboard/tradesperson/profile": "Update your business details, specialties, and service areas.",
  "/dashboard/admin/users": "View, manage, and promote all users on the platform.",
  "/dashboard/admin/jobs": "Oversee and manage all job postings across the system.",
  "/dashboard/admin/profile": "Update your administrator account details.",
  "/dashboard/business-owner": "Monitor KPIs for your plumbing business at a glance.",
  "/dashboard/business-owner/team": "Coordinate technicians, assign jobs, and track utilisation.",
  "/dashboard/business-owner/inventory": "Review stock levels, reorder points, and van supplies.",
  "/dashboard/business-owner/customers": "Browse customer history and follow up on repeat work.",
  "/dashboard/business-owner/my-quotes": "View and manage all the quotes your business has submitted.",
  "/dashboard/business-owner/job-board": "Find new opportunities and quote on available jobs in your area."
};

const sidebarQuickLinks: Record<UserRole, string[]> = {
  customer: ["/dashboard/customer/jobs", "/dashboard/customer/profile"],
  tradesperson: [
    "/dashboard/tradesperson/job-board",
    "/dashboard/tradesperson/my-quotes",
    "/dashboard/tradesperson/profile"
  ],
  admin: ["/dashboard/admin/users", "/dashboard/admin/jobs", "/dashboard/admin/profile"],
  user: [],
  business_owner: [
    "/dashboard/business-owner",
    "/dashboard/business-owner/team",
    "/dashboard/business-owner/inventory",
    "/dashboard/business-owner/customers",
    "/dashboard/business-owner/my-quotes",
    "/dashboard/business-owner/job-board"
  ],
  manager: []
};

const extraQuickLinks: Record<UserRole, QuickLink[]> = {
  customer: [
    {
      title: "Post a New Job",
      description: "Get quotes from local professionals for your plumbing needs.",
      href: "/dashboard/customer/jobs/create",
      icon: Plus
    }
  ],
  tradesperson: [],
  admin: [],
  user: [],
  business_owner: [
    {
      title: "Log a New Customer Job",
      description: "Record a new service request for a repeat customer and assign it instantly.",
      href: "/dashboard/business-owner/customers",
      icon: Plus
    }
  ],
  manager: []
};

export function getQuickLinksForRole(role: UserRole): QuickLink[] {
  const linksFromSidebar = allDashboardLinks
    .filter(link => sidebarQuickLinks[role]?.includes(link.href))
    .map(link => ({
      title: link.name,
      href: link.href,
      icon: link.icon as LucideIcon,
      description: descriptionByHref[link.href]
    }));

  return [...(extraQuickLinks[role] || []), ...linksFromSidebar];
}
