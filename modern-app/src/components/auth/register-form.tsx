"use client";

import { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextButton } from "@/components/ui/text-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icons";

import { Wrench, User, ArrowRight, Mail, AlertCircle, Eye, EyeOff, Check } from "lucide-react";

import { registerAction, type RegisterFormState } from "@/actions/auth/register";
import { useRecaptchaAction } from "@/hooks/use-recaptcha-action";
import { RECAPTCHA_ACTIONS } from "@/lib/recaptcha-service";
import { clientLogger } from "@/lib/utils/logger";

// -------------------------------------------
// RegisterForm Component
// -------------------------------------------
export function RegisterForm({ defaultRole = "customer" }: { defaultRole?: string }) {
  const [userType, setUserType] = useState(defaultRole);
  const [activeTab, setActiveTab] = useState(defaultRole);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // reCAPTCHA error message (client-side feedback)
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  // Shared reCAPTCHA hook – single source of truth
  const { recaptcha } = useRecaptchaAction(RECAPTCHA_ACTIONS.REGISTER);

  const [state, formAction, isPending] = useActionState<RegisterFormState, FormData>(registerAction, {
    errors: {},
    success: false
  });

  const [isTransitionPending, startTransition] = useTransition();
  const isBusy = isPending || isTransitionPending;

  // -------------------------------
  // Google sign in (NextAuth)
  // -------------------------------
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
      // navigation will occur on success
    } catch (error) {
      clientLogger.error("[RegisterForm] Google sign-in error:", error);
      setIsGoogleLoading(false);
    }
  };

  // -------------------------------
  // reCAPTCHA + ServerAction submit handler
  // -------------------------------
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecaptchaError(null);

    const formElement = event.currentTarget;

    // 1) Get token via shared hook (always preferred)
    const token = await recaptcha();

    if (!token) {
      setRecaptchaError(
        "reCAPTCHA is still loading or could not be verified. Please wait a few seconds and try again."
      );
      return; // Do NOT submit without token
    }

    // 2) Build FormData and append token under BOTH common keys
    const formData = new FormData(formElement);

    // For handlers expecting the classic reCAPTCHA field:
    formData.append("g-recaptcha-response", token);

    // For handlers expecting our JSON-style naming:
    formData.append("recaptchaToken", token);

    // 3) Submit via server action
    startTransition(() => {
      formAction(formData);
    });
  };

  const tabTriggerStyles = [
    "flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 text-xs sm:text-sm rounded-md border transition-all",
    "w-full whitespace-normal break-words text-center leading-snug",
    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary",
    "data-[state=active]:ring-2 data-[state=active]:ring-primary/30",
    "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border",
    "data-[state=inactive]:hover:bg-accent/50"
  ].join(" ");

  const ctaLabel = userType === "tradesperson" ? "Create Tradesperson Account" : "Create Customer Account";

  // -------------------------------
  // SUCCESS SCREEN (email verification)
  // -------------------------------
  if (state.success) {
    return (
      <Card className="w-full shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
            <Mail className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">Check Your Email</CardTitle>
            <CardDescription className="text-muted-foreground">We&apos;ve sent you a verification link</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Please check your email and click the verification link to complete your account setup.
            </p>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            Didn&apos;t receive it? Check spam or{" "}
            <TextButton asChild className="p-0 h-auto text-xs">
              <Link href="/resend-verification">resend email</Link>
            </TextButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  // -------------------------------
  // MAIN FORM
  // -------------------------------
  return (
    <Card className="w-full shadow-lg border-border">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
          <Image
            src="/images/branding/logo-dark.svg"
            alt="Plumbers Portal Logo"
            width={28}
            height={28}
            className="h-7 w-7 dark:hidden"
          />
          <Image
            src="/images/branding/logo-light.svg"
            alt="Plumbers Portal Logo"
            width={28}
            height={28}
            className="h-7 w-7 hidden dark:block"
          />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">Join Plumbers Portal</CardTitle>
          <CardDescription className="text-muted-foreground">Get started in less than 2 minutes</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Form-level error from server */}
        {state.errors?._form && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.errors._form[0]}</AlertDescription>
          </Alert>
        )}

        {/* Client-side reCAPTCHA error */}
        {recaptchaError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{recaptchaError}</AlertDescription>
          </Alert>
        )}

        {/* Google sign-in */}
        <Button
          variant="secondary"
          type="button"
          disabled={isGoogleLoading || isBusy}
          onClick={handleGoogleSignIn}
          className="w-full">
          {isGoogleLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Tabs for user type */}
        <div className="space-y-2 pb-4">
          <Label htmlFor="accountType" className="form-label-lg">
            I’m signing up as{" "}
            <span aria-hidden="true" className="text-muted-foreground">
              [select one]
            </span>
          </Label>

          <Tabs
            value={activeTab}
            onValueChange={value => {
              setActiveTab(value);
              setUserType(value);
            }}
            defaultValue="customer"
            className="w-full">
            <TabsList className="grid w-full grid-cols-2 items-stretch p-1 bg-muted/30 rounded-lg gap-2">
              <TabsTrigger value="customer" className={tabTriggerStyles}>
                <User className={activeTab === "customer" ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-60"} />
                <span>I need a plumber</span>
                {activeTab === "customer" && <Check className="h-5 w-5" />}
              </TabsTrigger>
              <TabsTrigger value="tradesperson" className={tabTriggerStyles}>
                <Wrench className={activeTab === "tradesperson" ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-60"} />
                <span>I am a plumber</span>
                {activeTab === "tradesperson" && <Check className="h-5 w-5" />}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* FORM START */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="role" value={userType} />

          {/* Honeypot */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="companyWebsite">Company Website</label>
            <input id="companyWebsite" name="companyWebsite" type="text" autoComplete="off" tabIndex={-1} />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="form-label-lg">
              Full Name
            </Label>
            <Input id="name" name="name" required disabled={isBusy} autoComplete="name" className="input-lg" />
            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="form-label-lg">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              disabled={isBusy}
              autoComplete="email"
              className="input-lg"
            />
            {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}

            {userType === "tradesperson" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                <span>
                  Tip: If you have a business email (like <span className="font-medium">contact@yourcompany.com</span>),
                  use it here to look more professional to customers. You can still use a personal email if you prefer.
                </span>
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="form-label-lg">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                disabled={isBusy}
                minLength={6}
                className="input-lg pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isBusy}
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {state.errors?.password && <p className="text-sm text-destructive">{state.errors.password[0]}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="form-label-lg">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                disabled={isBusy}
                className="input-lg pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isBusy}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {state.errors?.confirmPassword && (
              <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox id="terms" name="terms" disabled={isBusy} />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I agree to the
                <TextButton asChild className="p-0 h-auto ml-1 mr-1">
                  <Link href="/terms-of-service" target="_blank">
                    Terms of Service
                  </Link>
                </TextButton>
                <span>and</span>
                <TextButton asChild className="p-0 h-auto ml-1">
                  <Link href="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                </TextButton>
                .
              </label>
              {state.errors?.terms && <p className="text-sm text-destructive">{state.errors.terms[0]}</p>}
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isBusy}>
            {isBusy ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                {ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center space-y-3 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <TextButton asChild className="p-0 h-auto">
              <Link href="/login">Sign in</Link>
            </TextButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
