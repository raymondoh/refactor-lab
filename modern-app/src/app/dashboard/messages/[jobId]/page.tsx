// src/app/dashboard/messages/[jobId]/page.tsx
import { ChatMessages } from "@/components/messages/chat-messages";
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { userService } from "@/lib/services/user-service";
import { notFound, redirect } from "next/navigation";
import { ChatsCollection } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";

interface JobChatPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobChatPage({ params }: JobChatPageProps) {
  const { jobId } = await params;
  const session = await requireSession();

  const [job, chatSnap] = await Promise.all([jobService.getJobById(jobId), ChatsCollection().doc(jobId).get()]);

  if (!job) return notFound();

  const chatData = chatSnap.data() as
    | {
        customerId: string;
        tradespersonId: string;
      }
    | undefined;

  if (!chatData) {
    logger.error(`No chat document found for job ID: ${jobId}`);
    return redirect("/dashboard/messages");
  }

  const isCustomer = session.user.id === chatData.customerId;
  const isTradesperson = session.user.id === chatData.tradespersonId;
  const isAdmin = session.user.role === "admin";

  if (!isCustomer && !isTradesperson && !isAdmin) {
    return redirect("/dashboard");
  }

  const [customer, tradesperson] = await Promise.all([
    userService.getUserById(chatData.customerId),
    userService.getUserById(chatData.tradespersonId)
  ]);

  // Determine who we are chatting with
  const otherUser = isCustomer ? tradesperson : customer;

  const otherUserName = isCustomer
    ? tradesperson?.businessName || tradesperson?.name || "Tradesperson"
    : customer?.name || "Customer";

  // ✅ LOGIC APPLIED: Handle Fallback & Test Environment
  const rawImage = otherUser?.profilePicture;

  const otherUserImage =
    process.env.NODE_ENV === "test" && (rawImage || "").includes("firebasestorage")
      ? "/images/profile-pics/plumber-generic.webp" // Prevent external fetch in tests
      : rawImage || "/images/profile-pics/plumber-generic.webp"; // Default fallback

  return (
    <div className="h-full">
      <ChatMessages
        jobId={jobId}
        jobTitle={job.title}
        jobStatus={job.status}
        otherUserName={otherUserName}
        otherUserImage={otherUserImage}
      />
    </div>
  );
}
