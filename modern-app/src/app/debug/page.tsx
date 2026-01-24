import { notFound, redirect } from "next/navigation";
import ClientDebugPage from "./client-page";
import { requireSession } from "@/lib/auth/require-session";
import { isAdmin } from "@/lib/auth/roles";

export default async function DebugPage() {
  // 1. Environment Check: Disable this page entirely in production.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  // 2. Authentication & Authorization Check
  const session = await requireSession();
  if (!isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  // Only render the page if all checks pass.
  return <ClientDebugPage />;
}
