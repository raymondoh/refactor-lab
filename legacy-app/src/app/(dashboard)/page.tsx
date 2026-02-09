import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Route users to their specific dashboard based on their role
  if (session.user.role === "admin") {
    redirect("/admin");
  } else {
    redirect("/user");
  }
}
