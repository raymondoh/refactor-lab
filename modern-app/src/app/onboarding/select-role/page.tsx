// src/app/onboarding/select-role/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AppUser = Awaited<ReturnType<typeof requireSession>>["user"] & { uid?: string };

const ROLE_OPTIONS = [
  {
    label: "I need a plumber",
    description: "Find trusted tradespeople for your home or business.",
    value: "customer"
  },
  {
    label: "I am a plumber / tradesperson",
    description: "Create your profile and start receiving local leads.",
    value: "tradesperson"
  }
] as const;

export default async function SelectRolePage() {
  const session = await requireSession();
  const userSession = session.user as AppUser; // typed, no any

  const userId = userSession.uid ?? userSession.id;
  const user = await userService.getUserById(userId);

  // Already selected a role? Send them to dashboard
  if (user?.role) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <p className="text-sm text-muted-foreground">Welcome to Plumbers Portal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">How would you like to get started?</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Choose the option that best describes you so we can set up the right experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {ROLE_OPTIONS.map(option => (
            <Card key={option.value} className="h-full border-2">
              <CardHeader>
                <CardTitle>{option.label}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <form action="/api/auth/set-role" method="POST" className="flex flex-col gap-4">
                  <input type="hidden" name="role" value={option.value} />
                  <Button type="submit" className="w-full">
                    Continue
                  </Button>

                  <p className="text-sm text-muted-foreground">You can update your profile details after onboarding.</p>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Not you?{" "}
          <Link href="/api/auth/signout" className="font-medium text-primary underline">
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
