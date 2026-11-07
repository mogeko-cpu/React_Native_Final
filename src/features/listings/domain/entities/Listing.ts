// Un proyecto publicado en el campus (`listing.dart`). La fila vive en
// `listings`; el equipo, en `listing_members` (una fila por persona).

export type ListingStatus = "idea" | "inProgress" | "paused" | "done";
export const LISTING_STATUSES: ListingStatus[] = ["idea", "inProgress", "paused", "done"];

const STATUS_LABELS: Record<ListingStatus, string> = {
  idea: "Idea",
  inProgress: "En curso",
  paused: "Pausado",
  done: "Terminado",
};
export const statusLabel = (status: ListingStatus) => STATUS_LABELS[status];

// Solo `idea` y `En curso` reciben solicitudes.
export const acceptsRequests = (status: ListingStatus) => status === "idea" || status === "inProgress";

// Un proyecto sin `status` (filas de antes) se lee como idea.
export function statusFromName(name: unknown): ListingStatus {
  return LISTING_STATUSES.includes(name as ListingStatus) ? (name as ListingStatus) : "idea";
}

export type ListingRole = "leader" | "member" | "mentor";
const ROLES: ListingRole[] = ["leader", "member", "mentor"];
const ROLE_LABELS: Record<ListingRole, string> = { leader: "Líder", member: "Integrante", mentor: "Mentor" };
export const roleLabel = (role: ListingRole) => ROLE_LABELS[role];
// El mentor acompaña: ve el tablero, pero no mueve tarjetas.
export const canWorkTasks = (role: ListingRole | null | undefined) => role != null && role !== "mentor";
export const roleFromName = (name: unknown): ListingRole | null => (ROLES.includes(name as ListingRole) ? (name as ListingRole) : null);

export type ListingMember = {
  userId: string;
  userName: string;
  role: ListingRole;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
  creatorId: string;
  creatorName: string;
  maxMembers: number;
  requiredSkills: string[];
  // Quiénes están, según `listing_members`.
  memberIds: string[];
  groupId: string;
  groupName: string;
  status: ListingStatus;
  // Las filas con rol; un integrante viejo sin rol no aparece aquí.
  members: ListingMember[];
};

export function draftListing(p: {
  title: string;
  description: string;
  category: string;
  creatorId: string;
  creatorName: string;
  maxMembers: number;
  requiredSkills: string[];
  groupId?: string;
  groupName?: string;
}): Listing {
  return {
    id: "",
    ...p,
    groupId: p.groupId ?? "",
    groupName: p.groupName ?? "",
    status: "idea",
    memberIds: [p.creatorId],
    members: [{ userId: p.creatorId, userName: p.creatorName, role: "leader" }],
  };
}

// El equipo con su rol. Un integrante sin rol (filas de antes de los roles) es
// líder si creó el proyecto y nadie más lidera, e integrante si no.
export function teamOf(listing: Listing): ListingMember[] {
  const known = new Map(listing.members.map((m) => [m.userId, m]));
  const someoneLeads = listing.members.some((m) => m.role === "leader" && listing.memberIds.includes(m.userId));
  return listing.memberIds.map(
    (id) =>
      known.get(id) ?? {
        userId: id,
        userName: id === listing.creatorId ? listing.creatorName : "",
        role: id === listing.creatorId && !someoneLeads ? "leader" : "member",
      },
  );
}

// El mentor no ocupa cupo: un profesor puede acompañar a un equipo lleno.
export const memberCount = (listing: Listing) => teamOf(listing).filter((m) => m.role !== "mentor").length;
export const availableSlots = (listing: Listing) => listing.maxMembers - memberCount(listing);
export const mentorsOf = (listing: Listing) => teamOf(listing).filter((m) => m.role === "mentor");
export const hasMentor = (listing: Listing) => teamOf(listing).some((m) => m.role === "mentor");
export const isFull = (listing: Listing) => availableSlots(listing) <= 0;
export const belongsToGroup = (listing: Listing) => listing.groupId !== "";
export const isRecruiting = (listing: Listing) => acceptsRequests(listing.status) && !isFull(listing);

export function roleOf(listing: Listing, userId: string): ListingRole | null {
  return teamOf(listing).find((m) => m.userId === userId)?.role ?? null;
}

export const isLeader = (listing: Listing, userId: string) => roleOf(listing, userId) === "leader";

export function leaderIdOf(listing: Listing): string {
  return teamOf(listing).find((m) => m.role === "leader")?.userId ?? listing.creatorId;
}
