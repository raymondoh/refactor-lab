// src/components/dashboard/dashboard-header.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import SubscriptionBadge from "@/components/subscriptions/subscription-badge";
import NotificationBell from "@/components/notifications/notification-bell";
import { User, LogOut, LayoutDashboard, Home as HomeIcon } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({ title, description, actions, className }: DashboardHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

// Capitalize function remains useful for breadcrumbs
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Helper function to get profile link based on role
const getProfileLink = (role?: string) => {
  if (role === "customer") return "/dashboard/customer/profile";
  if (role === "tradesperson") return "/dashboard/tradesperson/profile";
  if (role === "admin") return "/dashboard/admin/profile";
  if (role === "business_owner") return "/dashboard/business-owner/profile";
  return null;
};

// Define main site navigation links
const baseNavigation = [
  { name: "Services", href: "/services" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" }
];

export function DashboardShellHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const segments = pathname.split("/").filter(Boolean);

  const profileLink = getProfileLink(session?.user?.role);
  const [mounted, setMounted] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const userInitials = getInitials(session?.user?.name || session?.user?.email) || "?";

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Skeleton to keep server + first client render identical
  if (!mounted) {
    return (
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>
        <div className="flex-1 ml-4 hidden md:flex">
          <div className="h-4 w-40 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
      {/* --- Left Side: Sidebar Trigger --- */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
      </div>

      {/* --- Center: Breadcrumbs (Desktop Only) --- */}
      <div className="flex-1">
        {!isMobile && (
          <Breadcrumb className="hidden md:flex ml-4">
            <BreadcrumbList>
              {segments.length > 0 && (
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              {segments.slice(1).map((segment, index) => {
                const isLast = index === segments.length - 2;
                const href = `/${segments.slice(0, index + 2).join("/")}`;
                return (
                  <React.Fragment key={href}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{capitalize(segment.replace(/-/g, " "))}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={href}>{capitalize(segment.replace(/-/g, " "))}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      {/* --- Right Side: Notifications and User Menu --- */}
      <div className="ml-auto flex items-center gap-2">
        {session?.user ? (
          <>
            {(session.user.role === "tradesperson" || session.user.role === "business_owner") && (
              <SubscriptionBadge
                tier={(session.user.subscriptionTier ?? "basic") as "basic" | "pro" | "business"}
                className="h-8 px-3"
              />
            )}
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="subtle" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user.image ?? ""} alt={session.user.name ?? ""} />
                    <AvatarFallback className={cn("bg-primary text-primary-foreground")}>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-background" align="end">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {profileLink && (
                  <DropdownMenuItem asChild>
                    <Link href={profileLink}>
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <HomeIcon className="mr-2 h-4 w-4" />
                    Main Site Home
                  </Link>
                </DropdownMenuItem>
                {baseNavigation.map(item => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="px-3 py-2">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-muted-foreground">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}
      </div>
    </header>
  );
}
