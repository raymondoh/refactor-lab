"use server";

import { auth } from "@/auth";
import { jobService } from "@/lib/services/job-service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function markJobComplete(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const jobId = formData.get("jobId") as string;

  await jobService.markJobComplete(jobId, session!.user!.id);

  revalidatePath(`/dashboard/tradesperson/job-board/${jobId}`);
}
