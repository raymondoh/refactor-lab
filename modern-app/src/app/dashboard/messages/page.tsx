// src/app/dashboard/messages/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ChatsCollection } from "@/lib/firebase/admin";
import { jobService } from "@/lib/services/job-service";
import { getStatusLabel } from "@/lib/types/job";

interface ChatDoc {
  jobId: string;
  customerId: string;
  tradespersonId: string;
}

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const customerChatsSnap = await ChatsCollection().where("customerId", "==", userId).get();
  const tradesChatsSnap = await ChatsCollection().where("tradespersonId", "==", userId).get();

  const chatDocs = [...customerChatsSnap.docs, ...tradesChatsSnap.docs];

  // Deduplicate by jobId so we only show each job once
  const chatMap = new Map<string, ChatDoc>();
  chatDocs.forEach(doc => {
    const data = doc.data() as ChatDoc;
    chatMap.set(data.jobId, data);
  });

  const chats = await Promise.all(
    Array.from(chatMap.values()).map(async chat => {
      const job = await jobService.getJobById(chat.jobId);
      return {
        jobId: chat.jobId,
        title: job?.title || chat.jobId,
        status: job?.status
      };
    })
  );

  return (
    <div className="p-4 space-y-4">
      <DashboardHeader title="Messages" description="Review and continue conversations about your jobs." />
      {chats.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <ul className="space-y-2">
          {chats.map(chat => (
            <li key={chat.jobId}>
              <Link href={`/dashboard/messages/${chat.jobId}`} className="text-blue-600 hover:underline">
                {chat.title}
              </Link>
              {chat.status && (
                <span className="ml-2 text-sm text-muted-foreground">({getStatusLabel(chat.status)})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
