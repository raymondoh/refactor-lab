"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Menu, LogIn, LogOut, UserPlus, User, Search, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { generalNavItems, adminNavItems, type NavItem } from "@/lib/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { UserAvatar } from "../shared/UserAvatar";
import { HeaderIconButton } from "./header-icon-button";

import { CartIcon } from "@/components/cart/cart-icon";
import { useSearch } from "@/contexts/SearchContext";
import { useTheme } from "next-themes";

// Custom hook for media queries
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);

    setMatches(media.matches);
    setIsLoading(false);

    media.addListener(listener);

    return () => {
      media.removeListener(listener);
    };
  }, [query]);

  return { matches, isLoading };
};

// Navigation links component
const NavLinks = ({ setOpen, isMobile }: { setOpen?: (open: boolean) => void; isMobile: boolean }) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        // Universal base styles
        "font-bold uppercase tracking-wide transition-colors",

        // --- Desktop vs. Mobile specific styles ---
        isMobile
          ? // Mobile base styles
            "w-full text-left text-lg py-3 px-6 flex items-center"
          : // Desktop base styles (no border)
            "text-sm py-2 px-3",

        // --- Active/Inactive state styling ---
        isActive(item.href)
          ? // Active state for both mobile and desktop is now just the text color
            "text-accent"
          : // Inactive state
          isMobile
          ? "text-muted-foreground" // Inactive on Mobile
          : "text-muted-foreground hover:text-accent" // Inactive on Desktop (with hover effect)
      )}
      onClick={() => setOpen?.(false)}>
      {isMobile && (
        <div className="w-1.5 h-1.5 rounded-full mr-3 bg-accent" style={{ opacity: isActive(item.href) ? 1 : 0 }}></div>
      )}
      <span>{item.title}</span>
      {isMobile && isActive(item.href) && (
        <div className="ml-auto">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 12L10 8L6 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </Link>
  );

  return (
    <div className={`flex ${isMobile ? "flex-col space-y-4" : "space-x-2"}`}>{generalNavItems.map(renderNavItem)}</div>
  );
};

// Main Navbar component
export const Navbar = () => {
  const { matches: isMobile, isLoading: isMediaQueryLoading } = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = useState(false);
  const { openSearch } = useSearch();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSearch]);

  if (isMediaQueryLoading) return <NavbarSkeleton />;

  return (
    <nav className="container max-w-8xl mx-auto flex items-center justify-between py-4 px-0 z-50">
      <div className="flex items-center">
        {isMobile ? (
          <div className="flex items-center">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <HeaderIconButton aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </HeaderIconButton>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle></SheetTitle>
                  <SheetDescription></SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <HeaderIconButton
                    onClick={() => {
                      openSearch();
                      setOpen(false);
                    }}
                    className="w-full flex justify-center items-center gap-2 mb-4"
                    aria-label="Search"></HeaderIconButton>
                  <NavLinks setOpen={setOpen} isMobile={true} />
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center ml-2 mr-0">
              <Logo className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold tracking-tight">
                MOTO<span className="text-accent">STIX</span>
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center">
            <Link href="/" className="flex items-center mr-10">
              <Logo className="h-9 w-9" />
              <span className="ml-3 text-2xl font-bold tracking-tight">
                MOTO<span className="text-accent">STIX</span>
              </span>
            </Link>
            <NavLinks isMobile={false} />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <HeaderIconButton onClick={openSearch} aria-label="Search">
          <Search className="h-5 w-5" />
        </HeaderIconButton>
        <CartIcon />
        <UserMenu />
      </div>
    </nav>
  );
};

// Skeleton loader for the Navbar
const NavbarSkeleton = () => (
  <nav className="container mx-auto flex items-center justify-between p-4">
    <div className="flex items-center">
      <Skeleton className="h-9 w-9 mr-3" />
      <Skeleton className="h-7 w-28" />
    </div>
    <div className="flex items-center space-x-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </div>
  </nav>
);

// UserMenu component (Dropdown for user actions and theme toggle)
const UserMenu = () => {
  const { data: session, status, update } = useSession();
  const { setTheme } = useTheme();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();

  const lastPathnameRef = useRef("");
  const hasCheckedSessionRef = useRef(false);
  const sessionCheckRef = useRef(false);
  const lastSessionCheckTimeRef = useRef(0);
  const isUpdatingSessionRef = useRef(false);

  useEffect(() => {
    const checkAccountDeleted = () => {
      const cookies = document.cookie.split(";");
      const hasDeletedCookie = cookies.some(cookie => cookie.trim().startsWith("account-deleted="));
      if (hasDeletedCookie) {
        document.cookie = "account-deleted=; Max-Age=-1; path=/;";
        window.location.reload();
      }
    };
    checkAccountDeleted();
  }, []);

  useEffect(() => {
    if (isUpdatingSessionRef.current || (pathname === lastPathnameRef.current && hasCheckedSessionRef.current)) {
      return;
    }
    const now = Date.now();
    if (now - lastSessionCheckTimeRef.current < 2000) {
      return;
    }

    if (!sessionCheckRef.current) {
      sessionCheckRef.current = true;
      lastPathnameRef.current = pathname;
      lastSessionCheckTimeRef.current = now;
      hasCheckedSessionRef.current = true;
      isUpdatingSessionRef.current = true;
      update().finally(() => {
        isUpdatingSessionRef.current = false;
      });
    }
  }, [pathname, update]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key?.includes("next-auth.session") ||
        event.key?.includes("next-auth.token") ||
        event.key?.includes("session") ||
        event.key?.includes("token")
      ) {
        update();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [update]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const result = await signOut({ redirect: false, callbackUrl: "/" });
      router.push(result?.url || "/");
      toast("You are now signed out.");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("An error occurred while signing out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleNavigation = (path: string) => router.push(path);

  const user = session?.user;
  const isLoggedIn = !!user;

  const themeItems = (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => setTheme("light")}>
        <Sun className="mr-2 h-4 w-4" /> Light
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")}>
        <Moon className="mr-2 h-4 w-4" /> Dark
      </DropdownMenuItem>
    </>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderIconButton className="hover:bg-background/70">
          {isLoggedIn ? (
            <UserAvatar src={user?.image} name={user?.name} email={user?.email} className="h-8 w-8" />
          ) : (
            <User className="h-5 w-5 text-black dark:text-white" />
          )}
        </HeaderIconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {status === "loading" ? (
          <DropdownMenuItem disabled className="flex justify-center items-center py-3">
            <Skeleton className="h-4 w-3/4" />
          </DropdownMenuItem>
        ) : isLoggedIn ? (
          <>
            {/* 1. User Info */}
            <DropdownMenuLabel className="flex items-center gap-3 p-4">
              <UserAvatar src={user?.image} name={user?.name} email={user?.email} className="h-10 w-10" />
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-base truncate">{user?.name || user?.email || "User"}</span>
                {user?.email && user?.name && (
                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* 2. Dashboard/Admin Links */}
            <DropdownMenuGroup>
              {user.role === "admin" ? (
                adminNavItems.map(item => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className="py-3 cursor-pointer">
                    <item.icon className="mr-3 h-5 w-5" />
                    <span className="text-base">{item.title}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem onClick={() => handleNavigation("/user")} className="py-3 cursor-pointer">
                  <LayoutDashboard className="mr-3 h-5 w-5" />
                  <span className="text-base">Dashboard</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            {/* 3. Dark Mode Section */}
            {themeItems}

            {/* 4. Log out button */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="py-3 cursor-pointer">
              <LogOut className="mr-3 h-5 w-5" />
              <span className="text-base">{isSigningOut ? "Signing out..." : "Log out"}</span>
            </DropdownMenuItem>
          </>
        ) : (
          // Logged-out state
          <>
            {/* 1. Account Label */}
            <DropdownMenuLabel className="p-4">
              <span className="font-medium text-base">Account</span>
            </DropdownMenuLabel>
            {/* 2. Dark Mode Section */}
            {themeItems}
            {/* 3. Log in / Sign up buttons */}
            <DropdownMenuSeparator /> {/* Separator before auth links */}
            <DropdownMenuItem className="py-3 cursor-pointer" asChild>
              <Link href="/login">
                <LogIn className="mr-3 h-5 w-5 text-primary" />
                <span className="text-base">Log in</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-3 font-medium cursor-pointer" asChild>
              <Link href="/register">
                <UserPlus className="mr-3 h-5 w-5 text-accent" />
                <span className="text-base">Sign up</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
