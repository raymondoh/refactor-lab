// src/app/dashboard/settings/page.tsx
import type { Metadata } from "next";

import { DeleteAccountCard } from "@/components/account/delete-account-card";
import { PasswordResetCard } from "@/components/account/password-reset-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ManageCookiesLink } from "@/components/legal/manage-cookies-link";

export const metadata: Metadata = {
  title: "Settings"
};

export default function DashboardSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage your account preferences, security, and data controls from one place.
        </p>
      </div>

      {/* Grid container for the cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PasswordResetCard />

        <Card>
          <CardHeader>
            <CardTitle>Privacy & Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Manage your cookie preferences for analytics and marketing.</p>
            {/* Changed variant to "outline" for better visual hierarchy */}
            <ManageCookiesLink variant="outline" />
          </CardContent>
        </Card>
        <DeleteAccountCard />
      </div>
    </div>
  );
}
