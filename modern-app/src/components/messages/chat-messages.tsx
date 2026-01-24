// // src/components/messages/chat-messages.tsx
"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getFirebaseDb, ensureFirebaseAuth } from "@/lib/firebase/client";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Icons
import { ArrowLeft, Image as ImageIcon, Flag, Ban, MoreVertical, X, AlertTriangle, Loader2 } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // ✅ Import Avatar
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import { getStatusColor, getStatusLabel, type JobStatus } from "@/lib/types/job";
import { storageService } from "@/lib/services/storage-service";
import { getInitials } from "@/lib/utils"; // ✅ Import utility for fallbacks

interface ChatMessagesProps {
  jobId: string;
  jobTitle: string;
  jobStatus: JobStatus;
  otherUserName: string;
  otherUserImage?: string | null; // ✅ Add optional image prop
}

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  senderId: string;
  receiverId: string;
  createdAt?: { seconds: number; nanoseconds: number } | Date;
  readBy?: string[];
}

export function ChatMessages({ jobId, jobTitle, jobStatus, otherUserName, otherUserImage }: ChatMessagesProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // --- Chat State ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- Action State ---
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const db = getFirebaseDb();
      if (!db) return;
      await ensureFirebaseAuth();
      const q = query(collection(db, "chats", jobId, "messages"), orderBy("createdAt", "asc"));
      unsub = onSnapshot(q, snap => {
        const msgs = snap.docs.map(doc => {
          const data = doc.data() as Omit<Message, "id">;
          return { id: doc.id, ...data };
        });
        setMessages(msgs);
      });
    })();
    return () => {
      if (unsub) unsub();
    };
  }, [jobId]);

  useEffect(() => {
    const markAsRead = async () => {
      if (!document.hasFocus()) return;
      const db = getFirebaseDb();
      if (!db || !session?.user?.id) return;
      await ensureFirebaseAuth();
      const unread = messages.filter(
        m => m.receiverId === session.user!.id && !(m.readBy || []).includes(session.user!.id)
      );
      await Promise.all(
        unread.map(m =>
          updateDoc(doc(db, "chats", jobId, "messages", m.id), {
            readBy: arrayUnion(session.user!.id)
          })
        )
      );
    };
    window.addEventListener("focus", markAsRead);
    markAsRead();
    return () => window.removeEventListener("focus", markAsRead);
  }, [messages, jobId, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetImageSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      event.target.value = "";
      return;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || sending) return;
    setSending(true);
    try {
      let imageUrl: string | undefined;

      if (selectedImage) {
        const sanitizedName = selectedImage.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storagePath = `chats/${jobId}/${Date.now()}-${sanitizedName}`;
        imageUrl = await storageService.uploadFile(selectedImage, storagePath);
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, text: input.trim(), imageUrl })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { message?: string });
        throw new Error(body?.message || "Failed to send message");
      }
      setInput("");
      resetImageSelection();
    } catch (error) {
      toast.error("Error sending message", {
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setSending(false);
    }
  };

  const handleBlockUser = async () => {
    setIsSubmittingAction(true);
    try {
      const res = await fetch("/api/messages/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });

      if (!res.ok) throw new Error("Failed to block user");

      toast.success("User blocked", { description: "This conversation has been closed." });
      setIsBlockOpen(false);
      router.refresh();
    } catch {
      toast.error("Error", { description: "Could not block user. Please try again." });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReportUser = async () => {
    if (!reportReason.trim()) {
      toast.error("Please provide a reason for the report.");
      return;
    }
    setIsSubmittingAction(true);
    try {
      const res = await fetch("/api/messages/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, reason: reportReason })
      });

      if (!res.ok) throw new Error("Failed to submit report");

      toast.success("Report submitted", { description: "We will review this issue shortly." });
      setIsReportOpen(false);
      setReportReason("");
    } catch {
      toast.error("Error", { description: "Could not submit report. Please try again." });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const jobLink =
    session?.user?.role === "customer"
      ? `/dashboard/customer/jobs/${jobId}`
      : `/dashboard/tradesperson/job-board/${jobId}`;

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Link href={jobLink}>
            <Button variant="subtle" size="icon" aria-label="Back to job">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          {/* ✅ Avatar Added Here */}
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={otherUserImage || ""} alt={otherUserName} />
            <AvatarFallback>{getInitials(otherUserName)}</AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-semibold text-lg">{jobTitle}</h2>
            <p className="text-sm text-muted-foreground">Chat with {otherUserName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(jobStatus)}>{getStatusLabel(jobStatus)}</Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Chat options">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsReportOpen(true)}>
                <Flag className="mr-2 h-4 w-4" />
                Report User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsBlockOpen(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Ban className="mr-2 h-4 w-4" />
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map(m => {
          const isOwn = m.senderId === session?.user?.id;
          return (
            <div
              key={m.id}
              className={`max-w-xs rounded px-3 py-2 text-sm leading-relaxed ${
                isOwn ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-foreground"
              }`}>
              {m.imageUrl ? (
                <div className="mb-2">
                  <Image
                    src={m.imageUrl}
                    alt={m.imageAlt || `Image attachment in chat about ${jobTitle}`}
                    width={240}
                    height={240}
                    className="rounded-md object-cover max-h-40 w-auto"
                  />
                </div>
              ) : null}

              {m.text ? <p>{m.text}</p> : null}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input row (unchanged) */}
      <div className="px-4 pt-4 pb-6 border-t bg-card space-y-3">
        {previewUrl ? (
          <div className="flex items-center gap-3 rounded-md border bg-muted/60 p-2">
            <Image
              src={previewUrl}
              alt="Selected attachment"
              width={64}
              height={64}
              className="h-16 w-16 rounded object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{selectedImage?.name}</p>
              <p className="text-xs text-muted-foreground">Ready to send</p>
            </div>
            <Button variant="ghost" size="icon" onClick={resetImageSelection} aria-label="Remove image">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <Button
            type="button"
            variant="subtle"
            size="icon"
            aria-label="Attach image"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Input
            className="flex-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Type a message"
            aria-label="Message text"
            autoComplete="off"
          />
          <Button
            type="button"
            aria-label="Send message"
            onClick={sendMessage}
            disabled={sending || (!input.trim() && !selectedImage)}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </Button>
        </div>
      </div>

      {/* Dialogs (unchanged) */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Please let us know why you are reporting this user. We review all reports within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the issue (e.g., abusive language, spam, scam attempt)..."
            value={reportReason}
            onChange={e => setReportReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="subtle" onClick={() => setIsReportOpen(false)} disabled={isSubmittingAction}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReportUser} disabled={isSubmittingAction || !reportReason.trim()}>
              {isSubmittingAction ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Block {otherUserName}?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to block this user? They will no longer be able to message you regarding this job.
              This action cannot be easily undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="subtle" onClick={() => setIsBlockOpen(false)} disabled={isSubmittingAction}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleBlockUser} disabled={isSubmittingAction}>
              {isSubmittingAction ? "Blocking..." : "Confirm Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
