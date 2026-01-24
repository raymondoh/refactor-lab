// src/components/account/password-reset-card.tsx
"use client";

import { useEffect, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { MailCheck, AlertCircle, RefreshCw } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { usePasswordResetRequest } from "@/components/auth/use-password-reset-request";

const ROLE_COPY: Record<string, string> = {
  admin: "admin",
  customer: "customer",
  tradesperson: "tradesperson",
  business_owner: "business user"
};

export function PasswordResetCard() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email ?? "";
  const role = session?.user?.role ?? "";
  const roleLabel = ROLE_COPY[role] ?? "account";

  const { email, setEmail, isLoading, success, error, submit, resetStatus } = usePasswordResetRequest(userEmail);

  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [setEmail, userEmail]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit(email.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Send a secure reset link to the email on file for your {roleLabel} login.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
              <MailCheck className="h-4 w-4" />
              Reset link sent
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              We emailed {email || "your account"}. Follow the link inside to set a new password.
            </p>
            <Button size="sm" variant="subtle" className="mt-4" onClick={resetStatus}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Send another link
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Account email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={Boolean(userEmail) || isLoading}
                readOnly={Boolean(userEmail)}
                required
              />
              {!userEmail && (
                <p className="text-xs text-muted-foreground">
                  Enter the email associated with your account to receive the reset link.
                </p>
              )}
            </div>
            <Button type="submit" disabled={isLoading || !email.trim()} className="w-full">
              {isLoading ? "Sending..." : "Email me a reset link"}
            </Button>
          </form>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
