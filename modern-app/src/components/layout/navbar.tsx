// // src/components/layout/navbar.tsx
// "use client";

// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { Button, buttonVariants } from "@/components/ui/button";
// import { signOut } from "next-auth/react";
// import type { Session } from "next-auth";
// import { User, UserPlus, LogOut, Menu, LayoutDashboard, ChevronDown, Search } from "lucide-react";
// import { useEffect, useMemo, useState } from "react";
// import { useSession } from "next-auth/react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger
// } from "@/components/ui/dropdown-menu";
// import { cn } from "@/lib/utils";
// import NotificationBell from "@/components/notifications/notification-bell";
// import SubscriptionBadge from "@/components/subscriptions/subscription-badge";
// import { AppLogo } from "@/components/layout/app-logo";
// import { Container } from "@/components/marketing/container";

// import { MobileSearchSheet } from "@/components/search/mobile-search-sheet";

// interface NavbarProps {
//   session: Session | null;
// }

// // Shared navigation link types
// type NavLink = { name: string; href: string };
// type NavDropdown = { name: string; items: NavLink[] };
// type PrimaryNavItem = NavLink | NavDropdown;

// const isNavLink = (item: PrimaryNavItem): item is NavLink => "href" in item;

// type Tier = "basic" | "pro" | "business";
// const asTier = (tier: unknown): Tier => {
//   if (tier === "pro" || tier === "business") return tier;
//   return "basic";
// };

// export function Navbar({ session }: NavbarProps) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
//   const [mounted, setMounted] = useState(false);
//   const { data: clientSession } = useSession();

//   // Helper to go to /search WITHOUT bringing a previous q along
//   const goToSearchClean = () => {
//     router.push("/search");
//   };

//   const resolvedClientSession = useMemo<Session | null>(() => {
//     if (!clientSession?.user) return null;

//     const hasDisplayInformation = Boolean(
//       clientSession.user.name || clientSession.user.email || clientSession.user.image
//     );

//     if (!hasDisplayInformation) {
//       if (session?.user) {
//         return {
//           ...session,
//           ...clientSession,
//           user: { ...session.user, ...clientSession.user }
//         } as Session;
//       }
//       return null;
//     }

//     if (session?.user) {
//       return {
//         ...session,
//         ...clientSession,
//         user: { ...session.user, ...clientSession.user }
//       } as Session;
//     }

//     return clientSession as Session;
//   }, [clientSession, session]);

//   const currentSession = resolvedClientSession ?? session ?? null;

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   const primaryNavigation: PrimaryNavItem[] = [
//     {
//       name: "For Homeowners",
//       items: [
//         { name: "How It Works", href: "/how-it-works" },
//         { name: "Services", href: "/services" }
//       ]
//     },
//     { name: "Pricing", href: "/pricing" },
//     { name: "About", href: "/about" },
//     { name: "Contact", href: "/contact" }
//   ];

//   const marketingLinks: NavLink[] = primaryNavigation.flatMap(item => (isNavLink(item) ? [item] : item.items));

//   // Active matcher supports nested routes
//   const isActive = (href: string) => {
//     if (href === "/") return pathname === "/";
//     return pathname === href || pathname.startsWith(`${href}/`);
//   };

//   const getProfileLink = (role?: string) => {
//     if (role === "customer") return "/dashboard/customer/profile";
//     if (role === "tradesperson") return "/dashboard/tradesperson/profile";
//     if (role === "admin") return "/dashboard/admin/profile";
//     return null;
//   };
//   const profileLink = getProfileLink(currentSession?.user?.role);

//   const getInitials = () => {
//     const name = currentSession?.user?.name;
//     if (name) {
//       const parts = name.split(" ").filter(Boolean).slice(0, 2); // first + last
//       if (parts.length) {
//         return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "U";
//       }
//     }
//     return currentSession?.user?.email?.[0]?.toUpperCase() || "U";
//   };

//   const handleSignOut = () => {
//     signOut({ callbackUrl: "/" });
//   };

//   // ✅ Profile image fallback logic for navbar avatar
//   const rawAvatarImage = currentSession?.user?.image ?? "";
//   const profileImageSrc =
//     process.env.NODE_ENV === "test" && rawAvatarImage.includes("firebasestorage")
//       ? "/images/profile-pics/plumber-generic.webp"
//       : rawAvatarImage || "/images/profile-pics/plumber-generic.webp";

//   if (!mounted) {
//     // Skeleton loader to prevent layout shift
//     return (
//       <nav className="sticky top-0 z-50 w-full border-b bg-background">
//         <Container className="flex h-16 items-center justify-between">
//           <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
//           <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
//         </Container>
//       </nav>
//     );
//   }

//   return (
//     <nav aria-label="Primary" className="sticky top-0 z-50 w-full border-b bg-background">
//       <Container className="flex h-16 items-center justify-between">
//         {/* Left: Logo + Base Navigation */}
//         <div className="flex items-center space-x-8">
//           <AppLogo />

//           {/* ⬇️ Show link row only at ≥lg so hamburger persists longer */}
//           <div data-testid="base-nav" className="hidden lg:flex space-x-1">
//             {primaryNavigation.map(item => {
//               if (isNavLink(item)) {
//                 const active = isActive(item.href);
//                 return (
//                   <Link
//                     key={item.name}
//                     href={item.href}
//                     aria-current={active ? "page" : undefined}
//                     className={cn(
//                       "px-4 py-2 rounded-lg text-sm font-medium",
//                       active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"
//                     )}>
//                     {item.name}
//                   </Link>
//                 );
//               }

//               const active = item.items.some(link => isActive(link.href));

//               return (
//                 <DropdownMenu key={item.name}>
//                   <DropdownMenuTrigger asChild>
//                     <button
//                       type="button"
//                       className={cn(
//                         "flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium",
//                         active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"
//                       )}>
//                       <span>{item.name}</span>
//                       <ChevronDown className="h-4 w-4" aria-hidden="true" />
//                     </button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="start" className="w-48 bg-background">
//                     {item.items.map(link => (
//                       <DropdownMenuItem key={link.name} asChild>
//                         <Link
//                           href={link.href}
//                           aria-current={isActive(link.href) ? "page" : undefined}
//                           className="px-3 py-2">
//                           {link.name}
//                         </Link>
//                       </DropdownMenuItem>
//                     ))}
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               );
//             })}
//           </div>
//         </div>

//         {/* Right: Auth buttons or User Menu */}
//         <div className="flex items-center space-x-2">
//           {/* 🔍 Mobile: open full-screen sheet */}
//           <Button
//             variant="ghost"
//             size="icon"
//             className="h-10 w-10 lg:hidden text-muted-foreground"
//             aria-label="Open search"
//             onClick={() => setMobileSearchOpen(true)}>
//             <Search className="size-6" />
//           </Button>

//           {/* 🔍 Desktop: navigate immediately to /search (no query) */}
//           <Button
//             variant="ghost"
//             size="icon"
//             className="h-10 w-10 hidden lg:inline-flex text-muted-foreground"
//             aria-label="Go to search"
//             onClick={goToSearchClean}>
//             <Search className="size-6" />
//           </Button>

//           {currentSession?.user ? (
//             // Logged in
//             <div className="flex items-center space-x-2" data-testid="nav-auth-area">
//               {/* Persistent tier badge for tradespeople AND business owners */}
//               {(currentSession.user.role === "tradesperson" || currentSession.user.role === "business_owner") && (
//                 <SubscriptionBadge tier={asTier(currentSession.user.subscriptionTier)} className="h-8 px-3" />
//               )}

//               <NotificationBell />

//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
//                     <Avatar className="h-10 w-10">
//                       <AvatarImage src={profileImageSrc} alt={currentSession.user.name ?? ""} />
//                       <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
//                     </Avatar>
//                   </Button>
//                 </DropdownMenuTrigger>

//                 <DropdownMenuContent className="w-56 bg-background" align="end">
//                   <DropdownMenuLabel className="font-normal">
//                     <p className="text-sm font-medium">{currentSession.user.name}</p>
//                     <p className="truncate text-xs text-muted-foreground">{currentSession.user.email}</p>
//                   </DropdownMenuLabel>

//                   <DropdownMenuSeparator />

//                   <DropdownMenuItem asChild>
//                     <Link href="/dashboard">
//                       <LayoutDashboard className="mr-2 h-4 w-4" />
//                       Dashboard
//                     </Link>
//                   </DropdownMenuItem>

//                   {profileLink && (
//                     <DropdownMenuItem asChild>
//                       <Link href={profileLink}>
//                         <User className="mr-2 h-4 w-4" />
//                         My Profile
//                       </Link>
//                     </DropdownMenuItem>
//                   )}

//                   <DropdownMenuSeparator />

//                   {/* Mirror marketing links in the user dropdown */}
//                   {marketingLinks.map(item => (
//                     <DropdownMenuItem key={item.name} asChild>
//                       <Link href={item.href} className="px-3 py-2">
//                         {item.name}
//                       </Link>
//                     </DropdownMenuItem>
//                   ))}

//                   <DropdownMenuSeparator />

//                   <DropdownMenuItem onClick={handleSignOut} className="text-muted-foreground">
//                     <LogOut className="mr-2 h-4 w-4" />
//                     Log out
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>
//           ) : (
//             // Logged out
//             <>
//               {/* ⬇️ Desktop actions & CTA only at ≥lg */}
//               <div className="hidden lg:flex items-center space-x-4">
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   asChild
//                   className="border border-primary text-primary hover:bg-primary/10 transition-colors">
//                   <Link href="/login">Sign In</Link>
//                 </Button>

//                 <Button asChild size="sm">
//                   <Link href="/register">
//                     <UserPlus className="h-4 w-4" />
//                     <span>Sign Up</span>
//                   </Link>
//                 </Button>
//               </div>

//               {/* ⬇️ Mobile/tablet: hamburger persists until <lg */}
//               <div className="lg:hidden">
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="ghost" size="icon" className="h-12 w-12 [&>svg]:!size-8" aria-label="Open menu">
//                       <Menu strokeWidth={1.75} />
//                     </Button>
//                   </DropdownMenuTrigger>

//                   <DropdownMenuContent align="end" className="w-56 bg-background">
//                     {/* Marketing links */}
//                     {primaryNavigation.map(item => {
//                       if (isNavLink(item)) {
//                         return (
//                           <DropdownMenuItem key={item.name} asChild>
//                             <Link href={item.href} className="px-3 py-2">
//                               {item.name}
//                             </Link>
//                           </DropdownMenuItem>
//                         );
//                       }

//                       return (
//                         <div key={item.name} className="px-2 py-1">
//                           <DropdownMenuLabel className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
//                             {item.name}
//                           </DropdownMenuLabel>
//                           {item.items.map(link => (
//                             <DropdownMenuItem key={link.name} asChild>
//                               <Link href={link.href} className="px-3 py-2">
//                                 {link.name}
//                               </Link>
//                             </DropdownMenuItem>
//                           ))}
//                           <DropdownMenuSeparator />
//                         </div>
//                       );
//                     })}

//                     <DropdownMenuSeparator />

//                     {/* Mobile CTA */}
//                     <DropdownMenuItem asChild>
//                       <Link href="/find-plumber" className="px-3 py-2 font-medium">
//                         Find a Plumber
//                       </Link>
//                     </DropdownMenuItem>

//                     <DropdownMenuSeparator />

//                     {/* Auth */}
//                     <DropdownMenuItem asChild>
//                       <Link href="/login" className="px-3 py-2">
//                         Sign In
//                       </Link>
//                     </DropdownMenuItem>
//                     <DropdownMenuSeparator />
//                     <DropdownMenuItem asChild>
//                       <Link
//                         href="/register"
//                         className={cn(buttonVariants({ variant: "primary", size: "sm" }), "w-full justify-start px-3")}>
//                         <UserPlus className="h-4 w-4" />
//                         <span>Sign Up</span>
//                       </Link>
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>
//             </>
//           )}
//         </div>
//       </Container>
//       {/* Full-screen mobile search sheet */}
//       <MobileSearchSheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen} />
//     </nav>
//   );
// }
// src/components/layout/navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { User, UserPlus, LogOut, Menu, LayoutDashboard, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notifications/notification-bell";
import SubscriptionBadge from "@/components/subscriptions/subscription-badge";
import { AppLogo } from "@/components/layout/app-logo";
import { Container } from "@/components/marketing/container";
import { MobileSearchSheet } from "@/components/search/mobile-search-sheet";

// 👇 ADDED: Firebase Auth imports for "Zombie Session" fix
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase/client";

interface NavbarProps {
  session: Session | null;
}

// Shared navigation link types
type NavLink = { name: string; href: string };
type NavDropdown = { name: string; items: NavLink[] };
type PrimaryNavItem = NavLink | NavDropdown;

const isNavLink = (item: PrimaryNavItem): item is NavLink => "href" in item;

type Tier = "basic" | "pro" | "business";
const asTier = (tier: unknown): Tier => {
  if (tier === "pro" || tier === "business") return tier;
  return "basic";
};

export function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: clientSession } = useSession();

  // Helper to go to /search WITHOUT bringing a previous q along
  const goToSearchClean = () => {
    router.push("/search");
  };

  const resolvedClientSession = useMemo<Session | null>(() => {
    if (!clientSession?.user) return null;

    const hasDisplayInformation = Boolean(
      clientSession.user.name || clientSession.user.email || clientSession.user.image
    );

    if (!hasDisplayInformation) {
      if (session?.user) {
        return {
          ...session,
          ...clientSession,
          user: { ...session.user, ...clientSession.user }
        } as Session;
      }
      return null;
    }

    if (session?.user) {
      return {
        ...session,
        ...clientSession,
        user: { ...session.user, ...clientSession.user }
      } as Session;
    }

    return clientSession as Session;
  }, [clientSession, session]);

  const currentSession = resolvedClientSession ?? session ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const primaryNavigation: PrimaryNavItem[] = [
    {
      name: "For Homeowners",
      items: [
        { name: "How It Works", href: "/how-it-works" },
        { name: "Services", href: "/services" }
      ]
    },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" }
  ];

  const marketingLinks: NavLink[] = primaryNavigation.flatMap(item => (isNavLink(item) ? [item] : item.items));

  // Active matcher supports nested routes
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const getProfileLink = (role?: string) => {
    if (role === "customer") return "/dashboard/customer/profile";
    if (role === "tradesperson") return "/dashboard/tradesperson/profile";
    if (role === "admin") return "/dashboard/admin/profile";
    return null;
  };
  const profileLink = getProfileLink(currentSession?.user?.role);

  const getInitials = () => {
    const name = currentSession?.user?.name;
    if (name) {
      const parts = name.split(" ").filter(Boolean).slice(0, 2); // first + last
      if (parts.length) {
        return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "U";
      }
    }
    return currentSession?.user?.email?.[0]?.toUpperCase() || "U";
  };

  // 👇 UPDATED: Double Logout (Firebase SDK + NextAuth)
  // 👇 REPLACEMENT FUNCTION
  const handleSignOut = async () => {
    try {
      // 1. Kill the Firebase SDK session (The Zombie)
      const app = getFirebaseApp(); // Get the app instance
      if (app) {
        // Only try to getAuth if the app actually exists
        const auth = getAuth(app);
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error("Firebase SDK logout error:", error);
      // We continue to NextAuth logout even if this fails
    }

    // 2. Kill the NextAuth session (The Cookie)
    await signOut({ callbackUrl: "/" });
  };

  // ✅ Profile image fallback logic for navbar avatar
  const rawAvatarImage = currentSession?.user?.image ?? "";
  const profileImageSrc =
    process.env.NODE_ENV === "test" && rawAvatarImage.includes("firebasestorage")
      ? "/images/profile-pics/plumber-generic.webp"
      : rawAvatarImage || "/images/profile-pics/plumber-generic.webp";

  if (!mounted) {
    // Skeleton loader to prevent layout shift
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background">
        <Container className="flex h-16 items-center justify-between">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        </Container>
      </nav>
    );
  }

  return (
    <nav aria-label="Primary" className="sticky top-0 z-50 w-full border-b bg-background">
      <Container className="flex h-16 items-center justify-between">
        {/* Left: Logo + Base Navigation */}
        <div className="flex items-center space-x-8">
          <AppLogo />

          {/* ⬇️ Show link row only at ≥lg so hamburger persists longer */}
          <div data-testid="base-nav" className="hidden lg:flex space-x-1">
            {primaryNavigation.map(item => {
              if (isNavLink(item)) {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium",
                      active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"
                    )}>
                    {item.name}
                  </Link>
                );
              }

              const active = item.items.some(link => isActive(link.href));

              return (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium",
                        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"
                      )}>
                      <span>{item.name}</span>
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-background">
                    {item.items.map(link => (
                      <DropdownMenuItem key={link.name} asChild>
                        <Link
                          href={link.href}
                          aria-current={isActive(link.href) ? "page" : undefined}
                          className="px-3 py-2">
                          {link.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </div>
        </div>

        {/* Right: Auth buttons or User Menu */}
        <div className="flex items-center space-x-2">
          {/* 🔍 Mobile: open full-screen sheet */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 lg:hidden text-muted-foreground"
            aria-label="Open search"
            onClick={() => setMobileSearchOpen(true)}>
            <Search className="size-6" />
          </Button>

          {/* 🔍 Desktop: navigate immediately to /search (no query) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hidden lg:inline-flex text-muted-foreground"
            aria-label="Go to search"
            onClick={goToSearchClean}>
            <Search className="size-6" />
          </Button>

          {currentSession?.user ? (
            // Logged in
            <div className="flex items-center space-x-2" data-testid="nav-auth-area">
              {/* Persistent tier badge for tradespeople AND business owners */}
              {(currentSession.user.role === "tradesperson" || currentSession.user.role === "business_owner") && (
                <SubscriptionBadge tier={asTier(currentSession.user.subscriptionTier)} className="h-8 px-3" />
              )}

              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profileImageSrc} alt={currentSession.user.name ?? ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56 bg-background" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{currentSession.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{currentSession.user.email}</p>
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

                  {/* Mirror marketing links in the user dropdown */}
                  {marketingLinks.map(item => (
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
            </div>
          ) : (
            // Logged out
            <>
              {/* ⬇️ Desktop actions & CTA only at ≥lg */}
              <div className="hidden lg:flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="border border-primary text-primary hover:bg-primary/10 transition-colors">
                  <Link href="/login">Sign In</Link>
                </Button>

                <Button asChild size="sm">
                  <Link href="/register">
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </Link>
                </Button>
              </div>

              {/* ⬇️ Mobile/tablet: hamburger persists until <lg */}
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-12 w-12 [&>svg]:!size-8" aria-label="Open menu">
                      <Menu strokeWidth={1.75} />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56 bg-background">
                    {/* Marketing links */}
                    {primaryNavigation.map(item => {
                      if (isNavLink(item)) {
                        return (
                          <DropdownMenuItem key={item.name} asChild>
                            <Link href={item.href} className="px-3 py-2">
                              {item.name}
                            </Link>
                          </DropdownMenuItem>
                        );
                      }

                      return (
                        <div key={item.name} className="px-2 py-1">
                          <DropdownMenuLabel className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {item.name}
                          </DropdownMenuLabel>
                          {item.items.map(link => (
                            <DropdownMenuItem key={link.name} asChild>
                              <Link href={link.href} className="px-3 py-2">
                                {link.name}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </div>
                      );
                    })}

                    <DropdownMenuSeparator />

                    {/* Mobile CTA */}
                    <DropdownMenuItem asChild>
                      <Link href="/find-plumber" className="px-3 py-2 font-medium">
                        Find a Plumber
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Auth */}
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="px-3 py-2">
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/register"
                        className={cn(buttonVariants({ variant: "primary", size: "sm" }), "w-full justify-start px-3")}>
                        <UserPlus className="h-4 w-4" />
                        <span>Sign Up</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </Container>
      {/* Full-screen mobile search sheet */}
      <MobileSearchSheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen} />
    </nav>
  );
}
