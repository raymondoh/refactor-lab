// src/app/(dashboard)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardEntryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "admin") redirect("/admin");
  redirect("/user");
}
