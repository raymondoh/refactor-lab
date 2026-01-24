// src/lib/services/notification-service.ts
import { getAdminCollection, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { config } from "@/lib/config/app-mode";
import type { Notification } from "@/lib/types/notification";
import type { DocumentData } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";

// Use the typed key rather than the collection path string to ensure a valid reference
const NotificationsCollection = () => getAdminCollection("NOTIFICATIONS");

interface INotificationService {
  createNotification(
    userId: string,
    type: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<Notification>;
  getNotificationsForUser(userId: string, limit?: number): Promise<Notification[]>;
  markAsRead(userId: string, notificationId: string): Promise<void>;
  markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void>;
}

class FirebaseNotificationService implements INotificationService {
  async createNotification(
    userId: string,
    type: string,
    message: string,
    metadata: Record<string, unknown> = {}
  ): Promise<Notification> {
    try {
      const now = new Date();
      const docRef = await NotificationsCollection().add({
        userId,
        type,
        message,
        metadata,
        read: false,
        createdAt: now
      });
      return {
        id: docRef.id,
        userId,
        type,
        message,
        metadata,
        read: false,
        createdAt: now
      };
    } catch (error) {
      logger.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  async getNotificationsForUser(userId: string, limit = 20): Promise<Notification[]> {
    try {
      const snapshot = await NotificationsCollection()
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const notifications: Notification[] = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          userId: data.userId as string,
          type: data.type as string,
          message: data.message as string,
          metadata: (data.metadata as Record<string, unknown>) || {},
          read: (data.read as boolean) || false,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        };
      });

      // Service layer returns domain objects with Date fields – JSON safety
      // should be handled at the API / route boundary if needed.
      return notifications;
    } catch (error) {
      logger.error("Error getting notifications for user:", error);
      throw new Error("Failed to get notifications");
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      // userId is available if you want to add an ownership check later
      await NotificationsCollection().doc(notificationId).update({ read: true });
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  async markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    try {
      const db = getFirebaseAdminDb();
      const batch = db.batch();
      notificationIds.forEach(id => {
        const docRef = NotificationsCollection().doc(id);
        batch.update(docRef, { read: true });
      });
      await batch.commit();
    } catch (error) {
      logger.error("Error marking notifications as read:", error);
      throw new Error("Failed to mark notifications as read");
    }
  }
}

class MockNotificationService implements INotificationService {
  private notifications: Notification[] = [];

  async createNotification(
    userId: string,
    type: string,
    message: string,
    metadata: Record<string, unknown> = {}
  ): Promise<Notification> {
    const notification: Notification = {
      id: (this.notifications.length + 1).toString(),
      userId,
      type,
      message,
      metadata,
      read: false,
      createdAt: new Date()
    };
    this.notifications.unshift(notification);
    return notification;
  }

  async getNotificationsForUser(userId: string, limit = 20): Promise<Notification[]> {
    return this.notifications.filter(n => n.userId === userId).slice(0, limit);
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === notificationId && n.userId === userId);
    if (notif) notif.read = true;
  }

  async markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    notificationIds.forEach(id => {
      const notif = this.notifications.find(n => n.id === id && n.userId === userId);
      if (notif) notif.read = true;
    });
  }
}

class NotificationServiceFactory {
  private static instance: INotificationService | null = null;

  static getInstance(): INotificationService {
    if (!NotificationServiceFactory.instance) {
      if (config.isMockMode) {
        NotificationServiceFactory.instance = new MockNotificationService();
      } else {
        NotificationServiceFactory.instance = new FirebaseNotificationService();
      }
    }
    return NotificationServiceFactory.instance;
  }
}

export const notificationService = NotificationServiceFactory.getInstance();
