// src/components/auth/role-guard.tsx
"use client";

import type React from "react";
import { useSession } from "next-auth/react";
import { canAccess, meetsRole, type UserRole } from "@/lib/auth/roles";

interface RoleGuardProps {
  children: React.ReactNode;
  role?: UserRole;
  minimumRole?: UserRole;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function RoleGuard({ children, role, minimumRole, fallback = null, showFallback = false }: RoleGuardProps) {
  const { data: session, status } = useSession();

  // Loading state
  if (status === "loading") {
    return showFallback ? fallback : null;
  }

  // Not authenticated
  if (!session?.user) {
    return showFallback ? fallback : null;
  }

  const userRole = session.user?.role;

  // Check specific role (admin override is handled by canAccess)
  if (role && !canAccess(userRole, [role])) {
    return showFallback ? fallback : null;
  }

  // Check minimum role
  if (minimumRole && !meetsRole(userRole, minimumRole)) {
    return showFallback ? fallback : null;
  }

  return <>{children}</>;
}
