import { NotificationDraft, NotificationTarget } from "./entities/AppNotification";
import { NotificationRepository } from "./repositories/NotificationRepository";

// Quién recibe qué (`notification_publisher.dart`). Comentario: el creador, su
// equipo y el grupo que lo publicó, menos quien comentó. Solicitud recibida:
// quien decide. Solicitud respondida: quien la hizo. Y así.
//
// **Fallar al notificar nunca hace fallar la acción que lo causó**: cada
// método se traga sus errores.
export class NotificationPublisher {
  constructor(private readonly repository: NotificationRepository) {}

  commentAdded(p: { listingId: string; listingTitle: string; authorId: string; authorName: string; comment: string; recipientIds: Iterable<string> }) {
    return this.send(p.recipientIds, p.authorId, (recipientId) => ({
      recipientId,
      type: "comment",
      title: `Nuevo comentario en "${p.listingTitle}"`,
      body: `${p.authorName}: ${snippet(p.comment)}`,
      target: "listing",
      targetId: p.listingId,
    }));
  }

  ideaPublished(p: { listingId: string; listingTitle: string; groupName: string; authorId: string; authorName: string; recipientIds: Iterable<string> }) {
    return this.send(p.recipientIds, p.authorId, (recipientId) => ({
      recipientId,
      type: "ideaPublished",
      title: `Nueva idea en ${p.groupName}`,
      body: `${p.authorName} publicó "${p.listingTitle}".`,
      target: "listing",
      targetId: p.listingId,
    }));
  }

  joinRequestReceived(p: { target: NotificationTarget; targetId: string; targetName: string; applicantId: string; applicantName: string; recipientId: string }) {
    const isGroup = p.target === "group";
    return this.send([p.recipientId], p.applicantId, (recipientId) => ({
      recipientId,
      type: "requestReceived",
      title: isGroup ? "Nueva solicitud para tu grupo" : "Nueva solicitud para tu proyecto",
      body: `${p.applicantName} quiere unirse a "${p.targetName}".`,
      target: p.target,
      targetId: p.targetId,
    }));
  }

  requestResolved(p: { accepted: boolean; target: NotificationTarget; targetId: string; targetName: string; deciderId: string; applicantId: string }) {
    const place = p.target === "group" ? "grupo" : "proyecto";
    return this.send([p.applicantId], p.deciderId, (recipientId) => ({
      recipientId,
      type: p.accepted ? "requestAccepted" : "requestRejected",
      title: p.accepted ? "Solicitud aceptada" : "Solicitud rechazada",
      body: p.accepted
        ? `Ya haces parte del ${place} "${p.targetName}".`
        : `Tu solicitud para unirte al ${place} "${p.targetName}" fue rechazada.`,
      target: p.target,
      targetId: p.targetId,
    }));
  }

  invitationReceived(p: { groupId: string; groupName: string; inviterId: string; inviterName: string; inviteeId: string }) {
    return this.send([p.inviteeId], p.inviterId, (recipientId) => ({
      recipientId,
      type: "invitationReceived",
      title: "Te invitaron a un grupo",
      body: `${p.inviterName} te invitó a unirte a "${p.groupName}".`,
      target: "group",
      targetId: p.groupId,
    }));
  }

  invitationResolved(p: { accepted: boolean; groupId: string; groupName: string; inviteeId: string; inviteeName: string; inviterId: string }) {
    return this.send([p.inviterId], p.inviteeId, (recipientId) => ({
      recipientId,
      type: p.accepted ? "invitationAccepted" : "invitationRejected",
      title: p.accepted ? "Invitación aceptada" : "Invitación rechazada",
      body: p.accepted ? `${p.inviteeName} aceptó unirse a "${p.groupName}".` : `${p.inviteeName} rechazó la invitación a "${p.groupName}".`,
      target: "group",
      targetId: p.groupId,
    }));
  }

  taskAssigned(p: { listingId: string; listingTitle: string; taskTitle: string; assignerId: string; assignerName: string; assigneeId: string }) {
    return this.send([p.assigneeId], p.assignerId, (recipientId) => ({
      recipientId,
      type: "taskAssigned",
      title: "Tienes una tarea nueva",
      body: `${p.assignerName} te asignó "${snippet(p.taskTitle)}" en "${p.listingTitle}".`,
      target: "listing",
      targetId: p.listingId,
    }));
  }

  memberRemoved(p: { listingId: string; listingTitle: string; deciderId: string; userId: string }) {
    return this.send([p.userId], p.deciderId, (recipientId) => ({
      recipientId,
      type: "memberRemoved",
      title: "Ya no estás en un proyecto",
      body: `El líder te retiró del equipo de "${p.listingTitle}".`,
      target: "listing",
      targetId: p.listingId,
    }));
  }

  roleChanged(p: { listingId: string; listingTitle: string; deciderId: string; userId: string; roleLabel: string; isLeadership: boolean }) {
    return this.send([p.userId], p.deciderId, (recipientId) => ({
      recipientId,
      type: "roleChanged",
      title: p.isLeadership ? `Ahora lideras "${p.listingTitle}"` : `Tu rol cambió en "${p.listingTitle}"`,
      body: p.isLeadership ? "Te transfirieron el liderazgo del proyecto." : `Ahora eres ${p.roleLabel.toLowerCase()} del equipo.`,
      target: "listing",
      targetId: p.listingId,
    }));
  }

  mentorshipRequested(p: { listingId: string; listingTitle: string; requesterId: string; requesterName: string; mentorId: string }) {
    return this.send([p.mentorId], p.requesterId, (recipientId) => ({
      recipientId,
      type: "mentorshipRequested",
      title: "Te pidieron ser mentor",
      body: `${p.requesterName} quiere que acompañes el proyecto "${p.listingTitle}".`,
      target: "listing",
      targetId: p.listingId,
    }));
  }

  mentorshipResolved(p: { accepted: boolean; listingId: string; listingTitle: string; mentorId: string; mentorName: string; recipientIds: Iterable<string> }) {
    return this.send(p.recipientIds, p.mentorId, (recipientId) => ({
      recipientId,
      type: p.accepted ? "mentorshipAccepted" : "mentorshipRejected",
      title: p.accepted ? "Su proyecto ya tiene mentor" : "Solicitud de mentoría rechazada",
      body: p.accepted
        ? `${p.mentorName} aceptó acompañar "${p.listingTitle}".`
        : `${p.mentorName} no puede acompañar "${p.listingTitle}" por ahora. Pueden pedírsela a otra persona.`,
      target: "listing",
      targetId: p.listingId,
    }));
  }

  private async send(recipientIds: Iterable<string>, except: string, build: (recipientId: string) => NotificationDraft) {
    try {
      const recipients = new Set([...recipientIds].filter((id) => id && id !== except));
      if (recipients.size === 0) return;
      await this.repository.send([...recipients].map(build));
    } catch {
      // Ignorado a propósito: ver arriba.
    }
  }
}

function snippet(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length <= 80 ? clean : `${clean.substring(0, 77)}...`;
}
