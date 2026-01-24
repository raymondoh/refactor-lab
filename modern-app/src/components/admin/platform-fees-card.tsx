// src/components/admin/platform-fees-card.tsx

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPlatformFeePercentages } from "@/lib/payments/fee";

export async function PlatformFeesCard() {
  const fees = getPlatformFeePercentages();

  const formatPercent = (value: number) => (value > 0 ? `${value.toFixed(2).replace(/\.00$/, "")}%` : "—");

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Platform Fees</CardTitle>
        <CardDescription>Percentage taken from each customer payment before the tradesperson payout.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                Basic
              </Badge>
            </div>
            <p className="font-medium">{formatPercent(fees.basic)}</p>
            <p className="text-xs text-muted-foreground">Default rate for new plumbers.</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                Pro
              </Badge>
            </div>
            <p className="font-medium">{formatPercent(fees.pro)}</p>
            <p className="text-xs text-muted-foreground">Reduced fee for Pro subscribers.</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                Business
              </Badge>
            </div>
            <p className="font-medium">{formatPercent(fees.business)}</p>
            <p className="text-xs text-muted-foreground">Lowest fee for Business plans.</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Fees are charged on the total customer payment. The tradesperson receives the payout minus this platform fee
          plus any standard Stripe processing fees.
        </p>
      </CardContent>
    </Card>
  );
}
