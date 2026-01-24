import { RegisterForm } from "@/components/auth/register-form";
import { isRegistrationEnabled } from "@/lib/featured-flags"; // ⬅ server-side helper

interface RegisterPageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const defaultRole = params?.role ?? "customer";

  const registrationOpen = isRegistrationEnabled();

  if (!registrationOpen) {
    // You can render anything you prefer here: a message, a redirect, etc.
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-semibold">Registrations Closed</h1>
        <p className="mt-4 text-muted-foreground">We’re not currently accepting new sign-ups.</p>
      </div>
    );
  }

  return <RegisterForm defaultRole={defaultRole} />;
}
