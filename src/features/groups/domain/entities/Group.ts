// Un grupo del campus (`group.dart`): los proyectos se publican a su nombre.
export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  members: GroupMember[];
};

export const memberIdsOf = (group: Group) => group.members.map((m) => m.userId);
export const isOwner = (group: Group, userId: string) => group.ownerId === userId;
export const hasMember = (group: Group, userId: string) => group.members.some((m) => m.userId === userId);

export type GroupRequestStatus = "pending" | "accepted" | "rejected";
const LABELS: Record<GroupRequestStatus, string> = { pending: "Pendiente", accepted: "Aceptada", rejected: "Rechazada" };
export const groupRequestStatusLabel = (status: GroupRequestStatus) => LABELS[status];

// Una solicitud para entrar a un grupo. Respondida, se borra.
export type GroupRequest = {
  id: string;
  groupId: string;
  applicantId: string;
  applicantName: string;
  message: string;
  status: GroupRequestStatus;
};

export const isPending = (request: GroupRequest) => request.status === "pending";

// Una invitación a un grupo. Existe solo mientras espera respuesta.
export type GroupInvitation = {
  id: string;
  groupId: string;
  groupName: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  inviteeName: string;
};

export type GroupMessage = {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: Date;
};
