// src/components/dashboard/AppSidebar.tsx
"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar";
import { userNavItems, adminNavItems, type NavItem } from "@/lib/navigation";

function normalizeHref(href: string) {
  // Ensure all nav links are absolute and never include an invisible route group like /dashboard/...
  if (!href.startsWith("/")) return `/${href}`;
  if (href.startsWith("/dashboard/")) return href.replace("/dashboard", "");
  return href;
}

function normalizeNavItems(items: NavItem[]): NavItem[] {
  return items.map(item => ({
    ...item,
    href: normalizeHref(item.href),
    subItems: item.subItems?.map(sub => ({
      ...sub,
      href: normalizeHref(sub.href)
    }))
  }));
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { isMobile, setOpenMobile } = useSidebar();

  // Determine navigation items based on route and session
  const getNavItems = (): NavItem[] => {
    // If we're on an admin route, default to admin nav items
    if (pathname.startsWith("/admin")) {
      return normalizeNavItems(adminNavItems);
    }

    // If session is still loading, return empty array to prevent flashing
    if (status === "loading") {
      return [];
    }

    // Use session role to determine nav items
    return normalizeNavItems(session?.user?.role === "admin" ? adminNavItems : userNavItems);
  };

  const navItems = getNavItems();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <Sidebar className="pt-6" collapsible="icon">
        <SidebarContent className="pt-5">
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Navigation Items */}
              {navItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href} onClick={handleLinkClick}>
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  {item.subItems && (
                    <SidebarMenuSub>
                      {item.subItems.map(subItem => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                            <Link href={subItem.href} onClick={handleLinkClick}>
                              {subItem.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
