import { AppNotification, NotificationDraft } from "../entities/AppNotification";

export interface NotificationRepository {
  // Las 100 más recientes de la persona.
  getMine(userId: string): Promise<AppNotification[]>;
  // Todas en una sola petición.
  send(notifications: NotificationDraft[]): Promise<void>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}
