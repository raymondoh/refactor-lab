// src/components/auth/enhanced-role-guard.tsx
"use client";

import type React from "react";
import { useSession } from "next-auth/react";
import { canAccess, meetsRole, hasPermission, type UserRole } from "@/lib/auth/roles";

interface EnhancedRoleGuardProps {
  children: React.ReactNode;
  // Role-based access
  role?: UserRole;
  roles?: UserRole[];
  minimumRole?: UserRole;
  // Permission-based access
  permission?: string;
  permissions?: string[];
  requireAllPermissions?: boolean;
  // Fallback options
  fallback?: React.ReactNode;
  showFallback?: boolean;
  // Loading state
  loadingComponent?: React.ReactNode;
}

export function EnhancedRoleGuard({
  children,
  role,
  roles,
  minimumRole,
  permission,
  permissions,
  requireAllPermissions = false,
  fallback = null,
  showFallback = false,
  loadingComponent = null
}: EnhancedRoleGuardProps) {
  const { data: session, status } = useSession();

  // Loading state
  if (status === "loading") {
    return loadingComponent || (showFallback ? fallback : null);
  }

  // Not authenticated
  if (!session?.user) {
    return showFallback ? fallback : null;
  }

  const userRole = session.user?.role;

  // Check specific role
  if (role && !canAccess(userRole, [role])) {
    return showFallback ? fallback : null;
  }

  // Check multiple roles (any of them)
  if (roles && !canAccess(userRole, roles)) {
    return showFallback ? fallback : null;
  }

  // Check minimum role
  if (minimumRole && !meetsRole(userRole, minimumRole)) {
    return showFallback ? fallback : null;
  }

  // Check single permission
  if (permission && !hasPermission(userRole, permission)) {
    return showFallback ? fallback : null;
  }

  // Check multiple permissions
  if (permissions) {
    const hasRequiredPermissions = requireAllPermissions
      ? permissions.every(p => hasPermission(userRole, p))
      : permissions.some(p => hasPermission(userRole, p));

    if (!hasRequiredPermissions) {
      return showFallback ? fallback : null;
    }
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminOnly({
  children,
  fallback,
  showFallback = false
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}) {
  return (
    <EnhancedRoleGuard role="admin" fallback={fallback} showFallback={showFallback}>
      {children}
    </EnhancedRoleGuard>
  );
}

export function CustomerOnly({
  children,
  fallback,
  showFallback = false
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}) {
  return (
    <EnhancedRoleGuard role="customer" fallback={fallback} showFallback={showFallback}>
      {children}
    </EnhancedRoleGuard>
  );
}

export function TradespersonOnly({
  children,
  fallback,
  showFallback = false
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}) {
  return (
    <EnhancedRoleGuard role="tradesperson" fallback={fallback} showFallback={showFallback}>
      {children}
    </EnhancedRoleGuard>
  );
}

export function ServiceProviderOnly({
  children,
  fallback,
  showFallback = false
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}) {
  return (
    <EnhancedRoleGuard roles={["tradesperson", "business_owner"]} fallback={fallback} showFallback={showFallback}>
      {children}
    </EnhancedRoleGuard>
  );
}

export function ManagementOnly({
  children,
  fallback,
  showFallback = false
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}) {
  return (
    <EnhancedRoleGuard roles={["manager", "admin"]} fallback={fallback} showFallback={showFallback}>
      {children}
    </EnhancedRoleGuard>
  );
}
