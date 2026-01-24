// src/components/jobs/quote-template-picker.tsx
"use client";

import { Fragment, useMemo } from "react";
import type { QuoteTemplate } from "@/lib/types/quote";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = {
  templates: QuoteTemplate[];
  onInsert: (template: QuoteTemplate) => void;
  isLoading?: boolean;
};

function formatPrice(template: QuoteTemplate) {
  const qty = template.defaultQuantity ?? 1;
  const price = template.unitPrice ?? 0;
  const vatRate = template.vatRate ?? 0;
  const total = qty * price * (1 + vatRate / 100);
  return `£${total.toFixed(2)} (${qty} × £${price.toFixed(2)}${vatRate ? ` +${vatRate}% VAT` : ""})`;
}

export function QuoteTemplatePicker({ templates, onInsert, isLoading }: Props) {
  const grouped = useMemo(() => {
    return templates.reduce<Record<string, QuoteTemplate[]>>((acc, template) => {
      const category = template.category ?? "other";
      if (!acc[category]) acc[category] = [];
      acc[category]?.push(template);
      return acc;
    }, {});
  }, [templates]);

  const groupedEntries = useMemo(() => Object.entries(grouped), [grouped]);

  if (isLoading) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 bg-muted rounded" />
            <div className="h-6 bg-muted rounded" />
            <div className="h-6 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground">Available Templates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates available yet.</p>
        ) : (
          groupedEntries.map(([category, items], idx) => (
            <Fragment key={category}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{items.length} options</span>
                </div>
              </div>
              <div className="grid gap-2">
                {items.map(template => (
                  <Button
                    key={template.id}
                    variant="secondary"
                    className="justify-between text-left h-auto py-3"
                    onClick={() => onInsert(template)}>
                    <div>
                      <div className="font-medium text-foreground">{template.label}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">{formatPrice(template)}</div>
                  </Button>
                ))}
              </div>
              {idx < groupedEntries.length - 1 && <Separator />}
            </Fragment>
          ))
        )}
      </CardContent>
    </Card>
  );
}
