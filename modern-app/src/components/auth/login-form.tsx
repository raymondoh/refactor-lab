// src/components/auth/login-form.tsx
"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextButton } from "@/components/ui/text-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/ui/icons";
import { AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight, UserPlus, Mail } from "lucide-react";
import { loginAction, type LoginFormState } from "@/actions/auth/login";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { clientLogger } from "@/lib/utils/logger";
import { useRecaptchaAction } from "@/hooks/use-recaptcha-action";
import { RECAPTCHA_ACTIONS } from "@/lib/recaptcha-service";

interface LoginFormProps {
  message?: string;
  callbackUrl?: string;
  email?: string;
  role?: string;
  verified?: string;
  needsOnboarding?: string;
}

export function LoginForm({ message, callbackUrl, email, role, verified, needsOnboarding }: LoginFormProps) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, isPending] = useActionState<LoginFormState, FormData>(loginAction, {
    errors: {}
  });

  const { recaptcha } = useRecaptchaAction(RECAPTCHA_ACTIONS.LOGIN);

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const [isTransitionPending, startTransition] = useTransition();

  const isBusy = isPending || isTransitionPending;

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        const target = state.redirectUrl || callbackUrl || "/dashboard";
        window.location.href = target;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.redirectUrl, callbackUrl]);

  const emailForInput = state?.resendHintEmail || email || "";

  async function handleResend() {
    try {
      setIsResending(true);
      setResendStatus("idle");
      setResendMessage(null);

      const targetEmail = state?.resendHintEmail || emailRef.current?.value || emailForInput;

      if (!targetEmail) {
        setResendStatus("error");
        setResendMessage("Please enter your email address first.");
        setIsResending(false);
        return;
      }

      // 🔐 Get reCAPTCHA token using shared hook
      const recaptchaToken = await recaptcha(RECAPTCHA_ACTIONS.RESEND_VERIFICATION);

      if (!recaptchaToken) {
        clientLogger.warn("[LoginForm] No reCAPTCHA token returned for resend");
        setResendStatus("error");
        setResendMessage("Could not verify reCAPTCHA. Please try again.");
        setIsResending(false);
        return;
      }

      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          recaptchaToken
        })
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
        setResendStatus("sent");
        setResendMessage(data?.message || "If an account exists for that email, we've sent a verification link.");
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setResendStatus("error");
        setResendMessage(data.error || "Something went wrong. Please try again in a moment.");
      }
    } catch (err) {
      clientLogger.error("[LoginForm] resend verification failed", err);
      setResendStatus("error");
      setResendMessage("Something went wrong. Please try again in a moment.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    // 🔐 Get reCAPTCHA token for LOGIN
    const token = await recaptcha(); // defaults to RECAPTCHA_ACTIONS.LOGIN

    if (!token) {
      clientLogger.warn("[LoginForm] No reCAPTCHA token; submitting without token");
    } else {
      formData.append("recaptchaToken", token);
    }

    startTransition(() => {
      formAction(formData);
    });
  }

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
          <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to your account</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {(verified === "true" || message === "verified") && (
          <Alert className="border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Email verified successfully!</div>
                {needsOnboarding && (
                  <div className="text-sm">
                    After signing in, you&apos;ll be guided through setting up your {role} profile.
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {needsOnboarding && verified && (
          <Alert className="border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">
            <UserPlus className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Complete Your Profile Setup</div>
              <div className="text-sm mt-1">
                We&apos;ll help you set up your {role} profile to get the most out of Plumbers Portal.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {state.success && (
          <Alert className="border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Login successful! You will be redirected shortly...</AlertDescription>
          </Alert>
        )}

        {state.unverifiedEmail && (
          <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Your email isn’t verified yet.</div>
                <p className="text-sm">
                  Please check your inbox for the verification link. If it’s expired or you can’t find it, resend a new
                  link below.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={handleResend}
                    disabled={isResending || isBusy}>
                    {isResending ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend verification email
                      </>
                    )}
                  </Button>
                </div>

                {resendStatus === "sent" && <div className="text-sm mt-2 text-foreground/80">{resendMessage}</div>}
                {resendStatus === "error" && <div className="text-sm mt-2 text-destructive">{resendMessage}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {state.errors?._form && !state.unverifiedEmail && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.errors._form[0]}</AlertDescription>
          </Alert>
        )}

        <Button
          variant="secondary"
          type="button"
          disabled={isBusy}
          className="w-full"
          onClick={() => signIn("google", { callbackUrl: callbackUrl ?? "/dashboard" })}>
          <Icons.google className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

          <div className="space-y-2">
            <Label htmlFor="email" className="form-label-lg">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              defaultValue={emailForInput}
              required
              disabled={isBusy}
              autoComplete="email"
              ref={emailRef}
              className="input-lg"
            />
            {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="form-label-lg">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                disabled={isBusy}
                autoComplete="current-password"
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

          <Button type="submit" className="w-full" disabled={isBusy}>
            {isBusy ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 pt-6">
        <TextButton size="sm" asChild>
          <Link href="/forgot-password">Forgot your password?</Link>
        </TextButton>
        <div className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <TextButton asChild className="p-0 h-auto">
            <Link href="/register">Sign up</Link>
          </TextButton>
        </div>
      </CardFooter>
    </Card>
  );
}
