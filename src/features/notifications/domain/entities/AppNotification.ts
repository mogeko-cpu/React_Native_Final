// Un aviso para una persona (`app_notification.dart`). Una fila por
// destinatario: «marcar como leída» es un `UPDATE` sobre la fila propia.
export type NotificationType =
  | "comment"
  | "ideaPublished"
  | "requestReceived"
  | "requestAccepted"
  | "requestRejected"
  | "invitationReceived"
  | "invitationAccepted"
  | "invitationRejected"
  | "taskAssigned"
  | "memberRemoved"
  | "roleChanged"
  | "mentorshipRequested"
  | "mentorshipAccepted"
  | "mentorshipRejected";

const TYPES: NotificationType[] = [
  "comment",
  "ideaPublished",
  "requestReceived",
  "requestAccepted",
  "requestRejected",
  "invitationReceived",
  "invitationAccepted",
  "invitationRejected",
  "taskAssigned",
  "memberRemoved",
  "roleChanged",
  "mentorshipRequested",
  "mentorshipAccepted",
  "mentorshipRejected",
];

export const notificationTypeFromName = (name: unknown): NotificationType | null =>
  TYPES.includes(name as NotificationType) ? (name as NotificationType) : null;

// A dónde lleva tocar el aviso.
export type NotificationTarget = "listing" | "group" | "none";
export const targetFromName = (name: unknown): NotificationTarget => (name === "listing" || name === "group" ? name : "none");

export type AppNotification = {
  id: string;
  recipientId: string;
  type: NotificationType | null;
  title: string;
  body: string;
  target: NotificationTarget;
  targetId: string;
  isRead: boolean;
  createdAt: Date;
};

export type NotificationDraft = {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  target: NotificationTarget;
  targetId: string;
};
