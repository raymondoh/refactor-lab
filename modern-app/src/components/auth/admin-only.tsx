// src/components/auth/admin-only.tsx
import type React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AppLogo } from "@/components/layout/app-logo";

interface AdminOnlyProps {
  children: React.ReactNode;
}

export async function AdminOnly({ children }: AdminOnlyProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user?.role;

  if (!isAdmin(userRole)) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-destructive rounded-lg flex items-center justify-center shadow-lg">
              {/* <Shield className="h-6 w-6 text-destructive-foreground" /> */}
              <AppLogo />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-foreground">Access Denied</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>You don&apos;t have permission to access this page.</AlertDescription>
            </Alert>

            <div className="bg-accent p-4 rounded-lg border border-border">
              <h4 className="font-medium text-foreground mb-2">What you can do:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Return to your dashboard</li>
                <li>Contact an administrator for access</li>
                <li>Check you&apos;re signed in with the correct account</li>
              </ul>
            </div>

            <Link href="/dashboard">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
