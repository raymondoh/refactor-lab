import type React from "react";
import {
  Home,
  Info,
  Mail,
  LayoutDashboard,
  UserCircle,
  Activity,
  Users,
  Receipt,
  ShoppingBag,
  Heart,
  Settings,
  Shield
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  hasDropdown?: boolean;
  subItems?: Array<{
    title: string;
    href: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }>;
};

// General navigation items visible to all users
export const generalNavItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: Home
  },
  {
    title: "Products",
    href: "/products",
    icon: ShoppingBag
  },
  {
    title: "About",
    href: "/about",
    icon: Info
  },
  {
    title: "Contact",
    href: "/contact",
    icon: Mail
  }
];

interface NavItemOld {
  title: string;
  href: string;
  icon: any;
}

// User-specific navigation items (for regular users)
export const userNavItems: NavItemOld[] = [
  {
    title: "Dashboard",
    href: "/user",
    icon: LayoutDashboard
  },
  {
    title: "My Orders",
    href: "/user/orders",
    icon: Receipt
  },
  {
    title: "My Likes",
    href: "/user/likes",
    icon: Heart
  },
  {
    title: "Profile",
    href: "/user/profile",
    icon: UserCircle
  },
  {
    title: "Settings",
    href: "/user/settings",
    icon: Settings
  },
  {
    title: "Activity",
    href: "/user/activity",
    icon: Activity
  },

  {
    title: "Data & Privacy",
    href: "/user/data-privacy",
    icon: Shield
  }
];

// Admin-specific navigation items
export const adminNavItems: NavItemOld[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: ShoppingBag
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: Receipt
  },
  {
    title: "Manage Users",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "Activity",
    href: "/admin/activity",
    icon: Activity
  },
  {
    title: "Admin Profile",
    href: "/admin/profile",
    icon: UserCircle
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings
  }
];
