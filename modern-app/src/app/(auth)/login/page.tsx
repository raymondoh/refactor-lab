// src/app/(auth)/login/page.tsx
import { LoginForm } from "@/components/auth/login-form";

type SearchParams = {
  message?: string;
  callbackUrl?: string;
  email?: string;
  role?: string;
  verified?: string;
  needsOnboarding?: string;
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query: SearchParams = {
    message: typeof params.message === "string" ? params.message : undefined,
    callbackUrl: typeof params.callbackUrl === "string" ? params.callbackUrl : undefined,
    email: typeof params.email === "string" ? params.email : undefined,
    role: typeof params.role === "string" ? params.role : undefined,
    verified: typeof params.verified === "string" ? params.verified : undefined,
    needsOnboarding: typeof params.needsOnboarding === "string" ? params.needsOnboarding : undefined
  };

  // The layout now handles all container, centering, and width logic.
  // This page component just needs to render the form.
  return <LoginForm {...query} />;
}
