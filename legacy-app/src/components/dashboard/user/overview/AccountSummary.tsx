"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AccountSummaryProps } from "@/types/dashboard";

import { serializeData } from "@/utils/serializeData";
import { formatDate } from "@/utils/date";
import type { SerializedUser } from "@/types/user";
export function AccountSummary({ user, profileUrl = "/user/profile", className }: AccountSummaryProps) {
  // Normalize the user data so that date fields are ISO strings.
  const normalizedUser = useMemo(() => serializeData(user) as SerializedUser, [user]);

  // Determine security status information
  const getSecurityStatus = () => {
    if (normalizedUser.has2FA) {
      return {
        status: "Secure",
        color: "text-green-600",
        icon: ShieldCheck,
        tooltip: "Your account is secured with two-factor authentication."
      };
    }
    if (normalizedUser.emailVerified && normalizedUser.hasPassword) {
      return {
        status: "Good",
        color: "text-yellow-600",
        icon: Shield,
        tooltip: "Your account has basic security. Consider enabling two-factor authentication."
      };
    }
    return {
      status: "At Risk",
      color: "text-red-600",
      icon: ShieldAlert,
      tooltip: "Your account security could be improved. Please verify your email and set a strong password."
    };
  };

  const securityInfo = getSecurityStatus();

  return (
    <Card className={`w-full overflow-hidden mr-0 ${className}`}>
      <CardHeader>
        <CardTitle>Account Summary</CardTitle>
        <CardDescription>Your account status and information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Account Type</p>
              <p className="capitalize truncate">{normalizedUser.role || "Free Plan"}</p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Member Since</p>

              <p className="truncate">{formatDate(normalizedUser.createdAt)}</p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Last Login</p>
              <p className="truncate">{formatDate(normalizedUser.lastLoginAt, { relative: true })}</p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Security Status</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className={`flex items-center gap-1 ${securityInfo.color} truncate`}>
                      <securityInfo.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{securityInfo.status}</span>
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{securityInfo.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="pt-4">
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link href={profileUrl}>
                Manage Profile <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
