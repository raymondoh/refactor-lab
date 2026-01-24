// src/components/jobs/submit-quote-form.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { PoundSterling, AlertTriangle, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription as DialogBodyDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { clientLogger } from "@/lib/utils/logger";
import { LiabilityDisclaimer } from "@/components/legal/liability-disclaimer";
import { trackEvent } from "@/lib/analytics";
import type { QuoteLineItem, QuoteTemplate, QuoteTemplateCategory, QuoteUnit } from "@/lib/types/quote";
import { QuoteTemplatePicker } from "@/components/jobs/quote-template-picker";
import { asTier, meets, type Tier } from "@/lib/subscription/tier";

const quoteFormSchema = z
  .object({
    price: z
      .string()
      .min(1, "Price is required")
      .refine(val => {
        const num = Number(val);
        return !Number.isNaN(num) && num >= 1;
      }, "Price must be at least £1"),
    depositAmount: z.string().optional(),
    description: z.string().min(10, "Description must be at least 10 characters"),
    estimatedDuration: z.string().min(1, "Please provide an estimated duration"),
    // Native date input returns a string
    availableDate: z.string().min(1, "Available date is required")
  })
  .refine(
    data => {
      if (!data.depositAmount) return true;
      const price = Number(data.price);
      const deposit = Number(data.depositAmount);
      return deposit <= price;
    },
    {
      message: "Deposit cannot be greater than the total price",
      path: ["depositAmount"]
    }
  );

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface SubmitQuoteFormProps {
  jobId: string;
  tierOverride?: "basic" | "pro" | "business";
}

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

const templateToLineItem = (template: QuoteTemplate): QuoteLineItem => ({
  id: generateId(),
  label: template.label,
  description: template.description,
  unit: template.unit,
  quantity: template.defaultQuantity,
  unitPrice: template.unitPrice,
  vatRate: template.vatRate,
  category: template.category,
  warrantyText: template.warrantyText
});

const calculateLineItemsTotal = (items: QuoteLineItem[]): number => {
  return items.reduce((sum, item) => {
    const base = item.quantity * item.unitPrice;
    const vatMultiplier = item.vatRate ? 1 + item.vatRate / 100 : 1;
    return sum + base * vatMultiplier;
  }, 0);
};

export function SubmitQuoteForm({ jobId, tierOverride }: SubmitQuoteFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const effectiveTier = asTier(tierOverride ?? session?.user?.subscriptionTier);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limitError, setLimitError] = useState<{
    message: string;
    used?: number;
    limit?: number;
  } | null>(null);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(true);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateSaveError, setTemplateSaveError] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<{
    lineItem: QuoteLineItem | null;
    label: string;
    category: QuoteTemplateCategory;
    defaultQuantity: number;
    unitPrice: number;
    unit: QuoteUnit;
    vatRate?: number;
    warrantyText?: string;
  }>({
    lineItem: null,
    label: "",
    category: "other",
    defaultQuantity: 1,
    unitPrice: 0,
    unit: "item",
    vatRate: undefined,
    warrantyText: ""
  });
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [templateFeedback, setTemplateFeedback] = useState<string | null>(null);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      price: "",
      depositAmount: "",
      description: "",
      estimatedDuration: "",
      availableDate: ""
    }
  });

  const lineItemsTotal = useMemo(() => calculateLineItemsTotal(lineItems), [lineItems]);
  // 🔹 What to show as the main total:
  // - If line items exist, use their total
  // - Otherwise, fall back to the manually entered price
  const watchedPrice = form.watch("price");
  const displayTotal = lineItems.length > 0 ? lineItemsTotal : Number(watchedPrice || 0) || 0;

  useEffect(() => {
    let isMounted = true;
    setTemplatesLoading(true);

    fetch("/api/quotes/templates")
      .then(async res => {
        if (!isMounted) return;
        if (!res.ok) {
          setTemplatesLoading(false);
          return;
        }
        const data = (await res.json()) as { templates?: QuoteTemplate[] };
        setTemplates(data.templates ?? []);
        setTemplatesLoading(false);
      })
      .catch(error => {
        if (!isMounted) return;
        clientLogger.error("[submit-quote-form] failed to load templates", error);
        setTemplatesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (lineItems.length === 0) return;
    form.setValue("price", lineItemsTotal.toFixed(2), {
      shouldValidate: true,
      shouldDirty: true
    });
  }, [lineItems, lineItemsTotal, form]);

  const addLineItem = (item?: QuoteLineItem) => {
    const base: QuoteLineItem = item ?? {
      id: generateId(),
      label: "",
      description: "",
      quantity: 1,
      unit: "item",
      unitPrice: 0,
      category: "other",
      vatRate: undefined,
      warrantyText: ""
    };

    setLineItems(prev => [...prev, base]);
  };

  const updateLineItem = (id: string, patch: Partial<QuoteLineItem>) => {
    setLineItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleInsertTemplate = (template: QuoteTemplate) => {
    addLineItem(templateToLineItem(template));
    if (!form.getValues("description")) {
      form.setValue("description", template.description, { shouldDirty: true });
    }
    setTemplateSheetOpen(false);
    setTemplateFeedback("Template inserted into your breakdown.");
  };

  const openSaveTemplateDialog = (item: QuoteLineItem) => {
    setTemplateSaveError(null);
    setTemplateDraft({
      lineItem: item,
      label: item.label || item.description || "New template",
      category: item.category ?? "other",
      defaultQuantity: item.quantity,
      unitPrice: item.unitPrice,
      unit: item.unit,
      vatRate: item.vatRate,
      warrantyText: item.warrantyText ?? ""
    });
    setSaveTemplateOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateDraft.lineItem) return;
    setIsSavingTemplate(true);
    setTemplateSaveError(null);
    try {
      const response = await fetch("/api/quotes/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: templateDraft.label,
          category: templateDraft.category,
          description: templateDraft.lineItem.description,
          unit: templateDraft.unit,
          defaultQuantity: Math.max(templateDraft.defaultQuantity, 0.01),
          unitPrice: templateDraft.unitPrice,
          vatRate: templateDraft.vatRate,
          warrantyText: templateDraft.warrantyText
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403 && typeof result.message === "string") {
          setTemplateSaveError(result.message);
          return;
        }
        throw new Error(result.message || "Failed to save template");
      }

      if (result.template) {
        setTemplates(prev => [...prev, result.template as QuoteTemplate]);
      }

      setSaveTemplateOpen(false);
      setTemplateFeedback("Saved to Templates.");
    } catch (error) {
      setTemplateSaveError((error as Error).message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  async function onSubmit(data: QuoteFormValues) {
    if (isSubmitting) return; // tiny extra guard
    setIsSubmitting(true);
    setLimitError(null);

    try {
      if (!executeRecaptcha) {
        toast.error("reCAPTCHA is still loading. Please try again in a moment.");
        return;
      }

      let recaptchaToken: string | null = null;

      try {
        recaptchaToken = await executeRecaptcha("submit_quote");
      } catch (error) {
        clientLogger.error("[submit-quote] executeRecaptcha error", error);
        toast.error("Could not verify reCAPTCHA. Please try again.");
        return;
      }

      if (!recaptchaToken) {
        toast.error("Could not verify reCAPTCHA. Please try again.");
        return;
      }

      // 🔹 Normalise line items so server-side Zod passes
      const normalizedLineItems =
        lineItems.length > 0
          ? lineItems.map((item, index) => {
              const label = (item.label ?? "").trim();
              const description = (item.description ?? "").trim();

              return {
                ...item,
                // If label is empty, fall back to description or a generic label
                label: label || description || `Line item ${index + 1}`,
                // Ensure description is at least something sensible
                description: description || label || `Work item ${index + 1}`
              };
            })
          : undefined;

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          price: Number(data.price),
          depositAmount: data.depositAmount ? Number(data.depositAmount) : undefined,
          description: data.description,
          estimatedDuration: data.estimatedDuration,
          availableDate: data.availableDate,
          recaptchaToken,
          // ✅ send normalised line items if present
          lineItems: normalizedLineItems
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (
          response.status === 403 &&
          (result.code === "quote_limit" || String(result.message || "").includes("quote limit"))
        ) {
          setLimitError({
            message: result.message || "You've reached your monthly quote limit.",
            used: typeof result.used === "number" ? result.used : undefined,
            limit: typeof result.limit === "number" ? result.limit : undefined
          });
          return;
        }
        throw new Error(result.message || "Failed to submit quote");
      }

      trackEvent("quote_submitted", {
        job_id: jobId,
        role: "tradesperson"
      });

      router.push("/dashboard/tradesperson/job-board?quote_sent=true");
      router.refresh();
    } catch (error) {
      toast.error("Failed to submit quote", {
        description: (error as Error).message || "Something went wrong. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="h-10 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-24 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (limitError) {
    const { used, limit, message } = limitError;
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Quote Limit Reached</AlertTitle>
        <AlertDescription>
          <p>{message}</p>
          {typeof used === "number" && typeof limit === "number" && (
            <p className="mt-2 text-sm text-muted-foreground">
              Usage this month: <strong>{used}</strong> / {limit}
            </p>
          )}
          <Button asChild className="mt-4">
            <Link href="/pricing">Upgrade Your Plan</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const showBasicInfo = !meets(effectiveTier, "pro");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Submit a Quote</CardTitle>
          <CardDescription>
            Build your quote using line items, then confirm the total, deposit (if any), and when you&apos;re available
            to start.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {showBasicInfo && (
                <Alert className="border-amber-500/40 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Basic plan</AlertTitle>
                  <AlertDescription className="text-sm">
                    You can submit up to <strong>5 quotes per month</strong> on the Basic plan. If you reach the limit,
                    we’ll prompt you to upgrade.
                  </AlertDescription>
                </Alert>
              )}

              <Accordion type="multiple" defaultValue={["breakdown", "pricing", "pitch"]} className="space-y-4">
                <AccordionItem value="breakdown">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    1. Build your breakdown
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Add the work you&apos;ll deliver. Templates are reusable line items that prefill your
                            details.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Line items automatically roll into your total price.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => addLineItem()}>
                            <Plus className="mr-1 h-4 w-4" /> Add line item
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setTemplateSheetOpen(true)}
                            disabled={templatesLoading && templates.length === 0}>
                            Add from template
                          </Button>
                        </div>
                      </div>

                      {templateFeedback && (
                        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                          <Check className="h-4 w-4" />
                          <span>{templateFeedback}</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        {lineItems.length === 0 ? (
                          <div className="rounded-md border border-dashed border-muted-foreground/40 p-4 text-sm text-muted-foreground">
                            Start by adding a line item or pull one in from your templates.
                          </div>
                        ) : (
                          lineItems.map((item, index) => {
                            const subtotal = calculateLineItemsTotal([item]);
                            return (
                              <Card key={item.id} className="border border-muted/70">
                                <CardContent className="space-y-3 p-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="text-sm font-semibold text-foreground">
                                        {item.label || `Line item ${index + 1}`}
                                      </div>
                                      {item.category && (
                                        <div className="text-xs text-muted-foreground capitalize">{item.category}</div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            className="h-8 px-2 text-xs"
                                            onClick={() => openSaveTemplateDialog(item)}>
                                            Save as template
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="text-xs">
                                          Reuse this line item on future quotes
                                        </TooltipContent>
                                      </Tooltip>
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="subtle"
                                        onClick={() => removeLineItem(item.id)}
                                        aria-label="Remove line item">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                      value={item.description}
                                      onChange={e => updateLineItem(item.id, { description: e.target.value })}
                                      placeholder="Describe the work or materials"
                                    />
                                  </div>

                                  <div className="grid gap-3 md:grid-cols-4">
                                    <div className="space-y-1">
                                      <Label>Quantity</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        step={0.1}
                                        value={item.quantity}
                                        onChange={e =>
                                          updateLineItem(item.id, {
                                            quantity: Number(e.target.value) || 0
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Unit</Label>
                                      <Select
                                        value={item.unit}
                                        onValueChange={val =>
                                          updateLineItem(item.id, {
                                            unit: val as QuoteUnit
                                          })
                                        }>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="hour">Hour</SelectItem>
                                          <SelectItem value="day">Day</SelectItem>
                                          <SelectItem value="item">Item</SelectItem>
                                          <SelectItem value="job">Job</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Unit price (£)</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={item.unitPrice}
                                        onChange={e =>
                                          updateLineItem(item.id, {
                                            unitPrice: Number(e.target.value) || 0
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>VAT %</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={item.vatRate ?? ""}
                                        onChange={e =>
                                          updateLineItem(item.id, {
                                            vatRate: e.target.value === "" ? undefined : Number(e.target.value)
                                          })
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <Label>Warranty (optional)</Label>
                                    <Textarea
                                      placeholder="Add warranty details if applicable"
                                      value={item.warrantyText ?? ""}
                                      onChange={e =>
                                        updateLineItem(item.id, {
                                          warrantyText: e.target.value
                                        })
                                      }
                                      rows={2}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-foreground">£{subtotal.toFixed(2)}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                        )}

                        <Button type="button" variant="secondary" onClick={() => addLineItem()} className="w-full">
                          <Plus className="mr-1 h-4 w-4" /> Add another line item
                        </Button>

                        <div className="flex items-center justify-between rounded-md border border-muted/60 bg-muted/20 px-3 py-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <PoundSterling className="h-4 w-4" />
                            <span>Line items total</span>
                          </div>
                          <span className="font-semibold">£{lineItemsTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pricing">
                  <AccordionTrigger className="text-left text-lg font-semibold">2. Price & schedule</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total price</FormLabel>
                              <FormControl>
                                <Input type="number" min={1} placeholder="0.00" inputMode="decimal" {...field} />
                              </FormControl>
                              <FormDescription>
                                Minimum £1. We auto-fill this from your line items—adjust if you need to round.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="depositAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deposit (optional)</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} placeholder="0.00" inputMode="decimal" {...field} />
                              </FormControl>
                              <FormDescription>
                                If you need an upfront deposit, include the amount here. Leave blank if no deposit is
                                required.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="availableDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Available start date</FormLabel>
                              <FormControl>
                                <Input type="date" min={new Date().toISOString().split("T")[0]} {...field} />
                              </FormControl>
                              <FormDescription>Customers will see when you can start.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pitch">
                  <AccordionTrigger className="text-left text-lg font-semibold">3. Your pitch</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="estimatedDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated duration</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 2 days" {...field} />
                            </FormControl>
                            <FormDescription>Let the customer know how long the job will take.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quote description</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={6}
                                placeholder="Summarise your approach, materials, and any key assumptions"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Give the customer enough detail to confidently choose your quote.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* ✅ Marketplace disclaimer for tradespeople submitting quotes */}
              <LiabilityDisclaimer context="tradesperson" variant="subtle" className="mt-2" />
            </CardContent>

            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
              <div className="flex w-full flex-col gap-1 text-sm text-muted-foreground sm:w-auto sm:items-end sm:text-right">
                <div className="flex items-center gap-2 text-foreground">
                  <PoundSterling className="h-4 w-4" />
                  <span className="font-semibold">£{displayTotal.toFixed(2)}</span>
                  <span className="text-muted-foreground">
                    {lineItems.length > 0 ? "from your line items" : "from your total price above"}
                  </span>
                </div>
                <span>
                  {lineItems.length > 0
                    ? "We use your breakdown to populate the total price above."
                    : "You haven't added line items, so we use the total price you entered above."}
                </span>
              </div>
              <div className="flex w-full justify-end gap-2 sm:w-auto">
                <Button
                  type="button"
                  variant="subtle"
                  onClick={() => router.push(`/dashboard/tradesperson/job-board/${jobId}`)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Quote"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Sheet open={templateSheetOpen} onOpenChange={setTemplateSheetOpen}>
        <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-2 pb-2 text-left">
            <SheetTitle>Insert from templates</SheetTitle>
            <SheetDescription>
              Templates are reusable line items. Insert one to prefill the description, unit, pricing, and VAT.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-2">
            <QuoteTemplatePicker templates={templates} onInsert={handleInsertTemplate} isLoading={templatesLoading} />
            <p className="text-xs text-muted-foreground">
              When you insert a template, it appears in your breakdown and contributes to the line items total.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
            <DialogBodyDescription>Reuse this line item on future quotes.</DialogBodyDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="template-label">Label</Label>
              <Input
                id="template-label"
                value={templateDraft.label}
                onChange={e =>
                  setTemplateDraft(draft => ({
                    ...draft,
                    label: e.target.value
                  }))
                }
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={templateDraft.category}
                  onValueChange={val =>
                    setTemplateDraft(draft => ({
                      ...draft,
                      category: val as QuoteTemplateCategory
                    }))
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labour">Labour</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="callout">Call-out</SelectItem>
                    <SelectItem value="warranty">Warranty</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={templateDraft.unit}
                  onValueChange={val =>
                    setTemplateDraft(draft => ({
                      ...draft,
                      unit: val as QuoteUnit
                    }))
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="item">Item</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Default quantity</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={templateDraft.defaultQuantity}
                  onChange={e =>
                    setTemplateDraft(draft => ({
                      ...draft,
                      defaultQuantity: Number(e.target.value) || draft.defaultQuantity
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Unit price (£)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={templateDraft.unitPrice}
                  onChange={e =>
                    setTemplateDraft(draft => ({
                      ...draft,
                      unitPrice: Number(e.target.value) || 0
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>VAT % (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={templateDraft.vatRate ?? ""}
                  onChange={e =>
                    setTemplateDraft(draft => ({
                      ...draft,
                      vatRate: e.target.value === "" ? undefined : Number(e.target.value)
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Warranty text (optional)</Label>
              <Textarea
                value={templateDraft.warrantyText ?? ""}
                onChange={e =>
                  setTemplateDraft(draft => ({
                    ...draft,
                    warrantyText: e.target.value
                  }))
                }
              />
            </div>
            {templateSaveError && <p className="text-sm text-destructive">{templateSaveError}</p>}
          </div>
          <DialogFooter className="flex justify-end gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="subtle">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveTemplate} disabled={isSavingTemplate}>
              {isSavingTemplate ? "Saving..." : "Save template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
