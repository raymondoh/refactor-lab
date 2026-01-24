// src/app/marketing/contact/contact-client.tsx
"use client";

import { useEffect, type ElementType, useActionState, useTransition } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Send,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  HelpCircle,
  Headphones,
  ArrowRight,
  Star,
  Loader2
} from "lucide-react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { PageHeader } from "@/components/marketing/page-header";
import { Container } from "@/components/marketing/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextButton } from "@/components/ui/text-button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { contactFormSchema, type ContactFormData } from "@/lib/schemas/contact-schema";
import { submitContactForm } from "@/actions/contact";
import { initialContactFormState } from "@/lib/contact-form-state";
import { clientLogger } from "@/lib/utils/logger";

const SUBJECT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "Account Issues", label: "Account Issues" },
  { value: "Technical Problems", label: "Technical Problems" },
  { value: "Billing & Payments", label: "Billing & Payments" },
  { value: "Platform Feedback", label: "Platform Feedback" },
  { value: "Other", label: "Other" }
];

type ContactDetailProps = {
  icon: ElementType;
  title: string;
  detail: string;
  subDetail?: string;
};

const ContactDetail = ({ icon: Icon, title, detail, subDetail }: ContactDetailProps) => (
  <div className="flex items-start gap-4">
    <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
    <div>
      <div className="font-medium text-card-foreground">{title}</div>
      <div className="text-muted-foreground">{detail}</div>
      {subDetail && <div className="text-sm text-muted-foreground">{subDetail}</div>}
    </div>
  </div>
);

// ✅ Match label style with other big forms
const fieldLabelClass = "text-base font-medium";

export default function ContactPage() {
  const { data: session } = useSession();
  const isBusinessUser = session?.user?.subscriptionTier === "business";

  const { executeRecaptcha } = useGoogleReCaptcha();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
      subject: "",
      message: ""
    }
  });

  const [state, formAction] = useActionState(submitContactForm, initialContactFormState);
  const [isPending, startTransition] = useTransition();

  // Keep form in sync with session if user signs in/out while on this page
  useEffect(() => {
    if (!session?.user) return;

    const currentName = form.getValues("name");
    const currentEmail = form.getValues("email");

    if (!currentName && session.user.name) {
      form.setValue("name", session.user.name, { shouldDirty: false, shouldValidate: false });
    }
    if (!currentEmail && session.user.email) {
      form.setValue("email", session.user.email, { shouldDirty: false, shouldValidate: false });
    }
  }, [form, session]);

  // React to server action result
  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      form.reset({
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        subject: "",
        message: ""
      });
    } else {
      toast.error(state.message);
    }
  }, [form, session, state]);

  const onSubmit = form.handleSubmit(async values => {
    if (!executeRecaptcha) {
      clientLogger.warn("[contact] executeRecaptcha not ready");
      toast.error("reCAPTCHA is still loading. Please wait a moment and try again.");
      return;
    }

    let recaptchaToken: string | null = null;

    try {
      recaptchaToken = await executeRecaptcha("contact_form");
    } catch (error) {
      clientLogger.error("[contact] executeRecaptcha error", error);
      toast.error("Could not verify reCAPTCHA. Please try again.");
      return;
    }

    if (!recaptchaToken) {
      clientLogger.warn("[contact] No reCAPTCHA token returned");
      toast.error("Could not verify reCAPTCHA. Please try again.");
      return;
    }

    const formData = new FormData();
    formData.append("name", values.name.trim());
    formData.append("email", values.email.trim());
    formData.append("subject", values.subject.trim());
    formData.append("message", values.message.trim());
    formData.append("recaptchaToken", recaptchaToken);

    startTransition(() => {
      formAction(formData);
    });
  });

  const isSubmitting = isPending || form.formState.isSubmitting;

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader />
      <PageHeader
        title="Contact Support"
        subtitle="Need help with your account, have platform questions, or experiencing technical issues? Our support team is here to help."
      />

      <section className="py-16 lg:py-24">
        <Container>
          <div className="space-y-12">
            {isBusinessUser && (
              <Card className="border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Star className="h-5 w-5" />
                    Priority Support
                  </CardTitle>
                  <CardDescription>
                    As a Business tier member, your requests are prioritized. Use the link below for expedited help.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <a href="mailto:support@plumbersportal.com?subject=[Priority Support - Business Tier] Your Request">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Priority Support
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left column: Contact methods + Self-help */}
              <div className="space-y-6 lg:col-span-1">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <Headphones className="h-5 w-5 text-primary" />
                      Contact Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ContactDetail
                      icon={Phone}
                      title="Support Helpline"
                      detail="0800 123 4567"
                      subDetail="Mon–Fri 9AM–6PM"
                    />
                    <Separator />
                    <ContactDetail
                      icon={Mail}
                      title="General Support"
                      detail="support@plumbersportal.com"
                      subDetail="Response within 4 hours"
                    />
                    <Separator />
                    <ContactDetail
                      icon={Mail}
                      title="Technical Issues"
                      detail="tech@plumbersportal.com"
                      subDetail="For app bugs & problems"
                    />
                    <Separator />
                    <ContactDetail icon={MapPin} title="Office Address" detail="123 Tech Hub, London, SW1A 1AA" />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Self-Help Resources
                    </CardTitle>
                    <CardDescription>Find answers to common questions instantly.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 flex flex-col">
                      <TextButton asChild className="h-auto justify-start p-0">
                        <Link href="/resources">
                          Resources <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </TextButton>
                      <TextButton asChild className="h-auto justify-start p-0">
                        <Link href="/terms-of-service">
                          Terms of Service <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </TextButton>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right column: Contact form + disclaimer */}
              <div className="lg:col-span-2">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Send us a Message
                    </CardTitle>
                    <CardDescription>
                      Tell us about your issue and we&apos;ll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={onSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={fieldLabelClass}>Full Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={fieldLabelClass}>Email Address *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={fieldLabelClass}>Issue Category *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="What type of help do you need?" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SUBJECT_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={fieldLabelClass}>Describe Your Issue *</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={6}
                                  placeholder="Please provide as much detail as possible about the issue you're experiencing..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Submit Support Request
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <Card className="mt-6 border-primary bg-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="mt-1 h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold text-primary">Platform Support Only</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          We provide support for using the Plumbers Portal platform. For actual plumbing work,
                          emergencies, or service issues, please contact your chosen plumber directly through the
                          platform.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
