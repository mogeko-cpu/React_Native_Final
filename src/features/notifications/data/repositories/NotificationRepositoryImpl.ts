import { byDateDesc, guardRoble, nowIso, parseDate, Row, str } from "@/src/core/roble/guard";
import { UserFacingError } from "@/src/core/utils/failure";
import { AppNotification, NotificationDraft, notificationTypeFromName, targetFromName } from "../../domain/entities/AppNotification";
import { NotificationRepository } from "../../domain/repositories/NotificationRepository";
import { NotificationDataSource } from "../datasources/NotificationDataSource";

const failure = (message: string) => new UserFacingError(message);

// La tabla no se limpia sola: la pantalla muestra las 100 más recientes.
const MAX_SHOWN = 100;

export class NotificationRepositoryImpl implements NotificationRepository {
  constructor(private readonly source: NotificationDataSource) {}

  async getMine(userId: string): Promise<AppNotification[]> {
    const rows = await guardRoble(() => this.source.readForRecipient(userId), failure);
    return rows
      .sort(byDateDesc("created_at"))
      .map(toNotification)
      .filter((n): n is AppNotification => n != null)
      .slice(0, MAX_SHOWN);
  }

  async send(notifications: NotificationDraft[]): Promise<void> {
    if (notifications.length === 0) return;
    const now = nowIso();
    await guardRoble(
      () =>
        this.source.insertAll(
          notifications.map((n) => ({
            recipient_id: n.recipientId,
            type: n.type,
            title: n.title,
            body: n.body,
            target_type: n.target,
            target_id: n.targetId,
            // `int4` (0/1), no booleano.
            is_read: 0,
            created_at: now,
          })),
        ),
      failure,
    );
  }

  markRead(notificationId: string) {
    return guardRoble(() => this.source.update(notificationId, { is_read: 1 }), failure);
  }

  async markAllRead(userId: string) {
    for (const notification of (await this.getMine(userId)).filter((n) => !n.isRead)) {
      await this.markRead(notification.id);
    }
  }
}

function toNotification(row: Row): AppNotification | null {
  const id = str(row._id);
  const recipientId = str(row.recipient_id);
  if (!id || !recipientId) return null;
  const read = row.is_read;
  return {
    id,
    recipientId,
    type: notificationTypeFromName(row.type),
    title: str(row.title),
    body: str(row.body),
    target: targetFromName(row.target_type),
    targetId: str(row.target_id),
    isRead: typeof read === "number" ? read !== 0 : String(read) === "1" || String(read) === "true",
    createdAt: parseDate(row.created_at),
  };
}
