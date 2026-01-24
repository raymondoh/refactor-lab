// src/components/dashboard/dashboard-sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import {
  Home,
  Users,
  Briefcase,
  User,
  FileText,
  Calendar,
  Shield,
  MessageSquare,
  Bookmark,
  Heart,
  Star,
  BarChart3,
  ChartColumn,
  ShieldCheck,
  Boxes,
  Contact,
  Settings,
  Receipt,
  Flag
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarMenuBadge
} from "@/components/ui/sidebar";
import { getInitials, cn } from "@/lib/utils";
import { clientLogger } from "@/lib/utils/logger";
import { AppLogo } from "@/components/layout/app-logo";
import { ROLES, type UserRole } from "@/lib/auth/roles";

export const allDashboardLinks: Array<{
  name: string;
  href: string;
  icon: React.ElementType;
  roles: readonly UserRole[];
  exact?: boolean;
}> = [
  // General
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: [ROLES.CUSTOMER, ROLES.TRADESPERSON, ROLES.ADMIN, ROLES.BUSINESS_OWNER],
    exact: true
  },
  {
    name: "Chats",
    href: "/dashboard/messages",
    icon: MessageSquare,
    roles: [ROLES.CUSTOMER, ROLES.TRADESPERSON, ROLES.BUSINESS_OWNER]
  },

  // Customer (in order)
  {
    name: "My Jobs",
    href: "/dashboard/customer/jobs",
    icon: Briefcase,
    roles: [ROLES.CUSTOMER],
    exact: true
  },
  {
    name: "Quotes Received",
    href: "/dashboard/customer/quotes",
    icon: FileText,
    roles: [ROLES.CUSTOMER]
  },
  {
    name: "Billing History",
    href: "/dashboard/customer/billing",
    icon: Receipt,
    roles: [ROLES.CUSTOMER]
  },
  {
    name: "Favorites",
    href: "/dashboard/customer/favorites",
    icon: Heart,
    roles: [ROLES.CUSTOMER]
  },
  {
    name: "Profile",
    href: "/dashboard/customer/profile",
    icon: User,
    roles: [ROLES.CUSTOMER]
  },

  // Tradesperson (work first, then insights/account)
  {
    name: "Job Board",
    href: "/dashboard/tradesperson/job-board",
    icon: Briefcase,
    roles: [ROLES.TRADESPERSON]
  },
  {
    name: "Saved Jobs",
    href: "/dashboard/tradesperson/saved-jobs",
    icon: Bookmark,
    roles: [ROLES.TRADESPERSON]
  },
  {
    name: "Quotes Submitted",
    href: "/dashboard/tradesperson/my-quotes",
    icon: FileText,
    roles: [ROLES.TRADESPERSON]
  },
  {
    name: "My Schedule",
    href: "/dashboard/tradesperson/schedule",
    icon: Calendar,
    roles: [ROLES.TRADESPERSON]
  },
  {
    name: "Analytics",
    href: "/dashboard/tradesperson/analytics",
    icon: BarChart3,
    roles: [ROLES.TRADESPERSON]
  },
  {
    name: "Favorited By",
    href: "/dashboard/tradesperson/favorited-by",
    icon: Heart,
    roles: [ROLES.TRADESPERSON]
  },
  {
    name: "My Profile",
    href: "/dashboard/tradesperson/profile",
    icon: User,
    roles: [ROLES.TRADESPERSON]
  },

  // Admin Specific (grouped together)
  {
    name: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    roles: [ROLES.ADMIN]
  },
  {
    name: "Job Management",
    href: "/dashboard/admin/jobs",
    icon: Shield,
    roles: [ROLES.ADMIN]
  },
  {
    name: "Certifications",
    href: "/dashboard/admin/certifications",
    icon: ShieldCheck,
    roles: [ROLES.ADMIN]
  },
  {
    name: "Reports & Safety",
    href: "/dashboard/admin/reports",
    icon: Flag,
    roles: [ROLES.ADMIN]
  },
  {
    name: "Admin Profile",
    href: "/dashboard/admin/profile",
    icon: User,
    roles: [ROLES.ADMIN]
  },

  // Admin & Business Owner Shared
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: ChartColumn,
    roles: [ROLES.ADMIN, ROLES.BUSINESS_OWNER]
  },

  // Business Owner Specific (in order)
  {
    name: "Job Board",
    href: "/dashboard/business-owner/job-board",
    icon: Briefcase,
    roles: [ROLES.BUSINESS_OWNER]
  },
  {
    name: "Saved Jobs",
    href: "/dashboard/business-owner/saved-jobs",
    icon: Bookmark,
    roles: [ROLES.BUSINESS_OWNER]
  },
  {
    name: "Quotes Submitted",
    href: "/dashboard/business-owner/my-quotes",
    icon: FileText,
    roles: [ROLES.BUSINESS_OWNER, ROLES.ADMIN]
  },
  {
    name: "Team Management",
    href: "/dashboard/business-owner/team",
    icon: Users,
    roles: [ROLES.BUSINESS_OWNER, ROLES.ADMIN]
  },
  {
    name: "Inventory",
    href: "/dashboard/business-owner/inventory",
    icon: Boxes,
    roles: [ROLES.BUSINESS_OWNER, ROLES.ADMIN]
  },
  {
    name: "Customers",
    href: "/dashboard/business-owner/customers",
    icon: Contact,
    roles: [ROLES.BUSINESS_OWNER, ROLES.ADMIN]
  },
  {
    name: "Profile Favorites",
    href: "/dashboard/business-owner/favorites",
    icon: Heart,
    roles: [ROLES.BUSINESS_OWNER]
  },
  {
    name: "Business Profile",
    href: "/dashboard/business-owner/profile",
    icon: User,
    roles: [ROLES.BUSINESS_OWNER]
  },

  // General (settings last)
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: [ROLES.CUSTOMER, ROLES.TRADESPERSON, ROLES.ADMIN, ROLES.BUSINESS_OWNER]
  }
];

interface DashboardSidebarProps {
  session: Session;
}

export function DashboardSidebar({ session }: DashboardSidebarProps) {
  const pathname = usePathname();

  const userRole: UserRole = (session.user?.role as UserRole | undefined) ?? ROLES.CUSTOMER;

  const tier = session.user.subscriptionTier ?? "basic";
  const isTradesperson = userRole === ROLES.TRADESPERSON;
  const isBusinessOwner = userRole === ROLES.BUSINESS_OWNER;
  const isBasicTier = tier === "basic";
  const isBusinessTier = tier === "business";

  const [unreadMessages, setUnreadMessages] = useState(0);

  // ❌ OLD: canAccess with admin override (caused admin to see EVERYTHING)
  // let navigation = allDashboardLinks.filter(link => canAccess(userRole, link.roles));

  // ✅ NEW: sidebar menu is strictly driven by explicit role lists
  let navigation = allDashboardLinks.filter(link => link.roles.includes(userRole));

  // Tier-based filtering for tradespeople (UI only – business rules enforced server-side)
  if (isTradesperson) {
    if (isBasicTier) {
      navigation = navigation.filter(
        link => !["/dashboard/tradesperson/saved-jobs", "/dashboard/tradesperson/schedule"].includes(link.href)
      );
    }
    if (!isBusinessTier) {
      navigation = navigation.filter(
        link => !["/dashboard/tradesperson/analytics", "/dashboard/tradesperson/favorited-by"].includes(link.href)
      );
    }
  }

  // Fetch unread messages
  useEffect(() => {
    if (userRole === ROLES.CUSTOMER || userRole === ROLES.TRADESPERSON) {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch("/api/messages/unread-count");
          if (response.ok) {
            const data = await response.json();
            setUnreadMessages(data.count);
          }
        } catch (error) {
          clientLogger.error("Failed to fetch unread message count:", error);
        }
      };
      fetchUnreadCount();
    }
  }, [userRole]);

  // Display name / initials
  const displayName =
    (isBusinessOwner || isTradesperson) && session.user?.businessName
      ? session.user.businessName
      : session.user?.name || session.user?.email || "User";

  const nameForInitials =
    (isBusinessOwner || isTradesperson) && session.user?.businessName ? session.user.businessName : session.user?.name;

  const userInitials = getInitials(nameForInitials) || "U";

  return (
    <Sidebar collapsible="icon" className="w-64 bg-background border-r border-border h-full fixed md:static z-50">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
              <AppLogo />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel />
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map(item => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-colors",
                          isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/10"
                        )}
                        aria-current={isActive ? "page" : undefined}>
                        <item.icon />
                        {item.name}
                      </Link>
                    </SidebarMenuButton>

                    {item.href === "/dashboard/messages" && unreadMessages > 0 && (
                      <SidebarMenuBadge>{unreadMessages}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isTradesperson && isBasicTier && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      href="/pricing"
                      className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20">
                      <Star className="w-5 h-5" />
                      <span>Upgrade Plan</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-3 py-4 text-base font-medium text-foreground">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm",
                  "bg-muted text-muted-foreground",
                  "dark:bg-muted dark:text-muted-foreground"
                )}>
                {userInitials}
              </div>
              <span className="truncate text-sm font-semibold text-foreground group-data-[collapsible=icon]:hidden">
                {displayName}
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
