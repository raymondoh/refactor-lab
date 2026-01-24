"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextButton } from "@/components/ui/text-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, onSnapshot, orderBy, type DocumentData } from "firebase/firestore";
import { ensureFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import type { Notification } from "@/lib/types/notification";

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // <-- FIX: Add mounted state

  // This effect runs only on the client, after the initial render.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const setupListener = async () => {
      const user = await ensureFirebaseAuth();
      if (!user) return;

      const db = getFirebaseDb();
      if (!db) return;

      const q = query(
        collection(db, "notifications"),
        where("userId", "==", session.user.id),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, snapshot => {
        const userNotifications: Notification[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as DocumentData;
          userNotifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          } as Notification);
        });
        setNotifications(userNotifications);
        const unread = userNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      });

      return unsubscribe;
    };

    const unsubscribePromise = setupListener();

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, [session?.user?.id]);

  const handleMarkAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setUnreadCount(0);
    setNotifications(current => current.map(n => ({ ...n, read: true })));

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds: unreadIds })
    });
  };

  if (!session) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="subtle" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {/* FIX: Only render the badge on the client after mounting */}
          {mounted && unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-2 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <TextButton size="sm" onClick={handleMarkAsRead}>
              <Check className="mr-2 h-4 w-4" /> Mark all as read
            </TextButton>
          )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div key={notif.id} className={`p-2 rounded-md ${!notif.read ? "bg-secondary" : ""}`}>
                <p className="font-semibold">{notif.type}</p>
                <p className="text-sm text-muted-foreground">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No notifications yet.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
