"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

// 1. A simple schema for just one field
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address.")
});

type NewsletterFormValues = z.infer<typeof formSchema>;

export function NewsletterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" }
  });

  // 2. The submit handler points to your new Mailchimp API route
  async function onSubmit(values: NewsletterFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/mailchimp/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      toast.success(data.message || "Successfully subscribed!");
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to subscribe.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      {/* 3. The form layout is simpler, designed for one line */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-background border-border focus:border-primary"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Subscribe <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
