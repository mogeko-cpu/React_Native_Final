// Una postulación a un proyecto (`join_request.dart`).
export type JoinRequestStatus = "pending" | "accepted" | "rejected";

const LABELS: Record<JoinRequestStatus, string> = { pending: "Pendiente", accepted: "Aceptada", rejected: "Rechazada" };
export const requestStatusLabel = (status: JoinRequestStatus) => LABELS[status];

// Un valor desconocido se lee como pendiente: el estado que deja la solicitud
// visible y accionable.
export function requestStatusFromName(name: unknown): JoinRequestStatus {
  return name === "accepted" || name === "rejected" ? name : "pending";
}

export type JoinRequest = {
  id: string;
  listingId: string;
  applicantId: string;
  applicantName: string;
  motivation: string;
  skills: string;
  availability: string;
  status: JoinRequestStatus;
};
