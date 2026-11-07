import { JoinRequest } from "../entities/JoinRequest";
import { Listing, ListingRole } from "../entities/Listing";

// Los proyectos (`i_listing_repository.dart`). Las reglas viven aquí y no solo
// en la pantalla: un botón escondido es una pista, no una regla, y del lado de
// ROBLE nada sabe quién lidera qué.
export interface ListingRepository {
  getListings(): Promise<Listing[]>;
  // Lo que ofrece Inicio: proyectos que buscan gente (hasta 5).
  getFeaturedListings(): Promise<Listing[]>;
  getListingById(id: string): Promise<Listing | null>;
  createListing(draft: Listing): Promise<Listing>;
  createJoinRequest(request: Omit<JoinRequest, "id" | "status">): Promise<JoinRequest>;
  getRequestsForListing(listingId: string): Promise<JoinRequest[]>;
  getMyRequestForListing(listingId: string, applicantId: string): Promise<JoinRequest | null>;
  acceptJoinRequest(requestId: string): Promise<void>;
  rejectJoinRequest(requestId: string): Promise<void>;
  getMyListings(userId: string): Promise<Listing[]>;
  getJoinedListings(userId: string): Promise<Listing[]>;
  getListingsByGroup(groupId: string): Promise<Listing[]>;
  getMyRequests(applicantId: string): Promise<JoinRequest[]>;
  deleteListing(listingId: string): Promise<void>;
  // Guarda el formulario de edición. Solo el líder, y el equipo no puede quedar
  // más grande que el tamaño nuevo.
  updateListing(updated: Listing, actorId: string): Promise<Listing>;
  // Rechaza lo que sigue esperando y lo devuelve, para avisarle a cada quien.
  closePendingRequests(listingId: string): Promise<JoinRequest[]>;
  removeMember(p: { listingId: string; userId: string; actorId: string }): Promise<void>;
  leaveListing(p: { listingId: string; userId: string }): Promise<void>;
  setMemberRole(p: { listingId: string; userId: string; role: ListingRole; actorId: string }): Promise<void>;
  // El mentor que acaba de aceptar: no ocupa cupo.
  addMentor(p: { listingId: string; userId: string; userName: string }): Promise<void>;
  transferLeadership(p: { listingId: string; newLeaderId: string; actorId: string }): Promise<void>;
}

// El equipo más pequeño y el más grande que ofrece el formulario.
export const MIN_TEAM_SIZE = 2;
export const MAX_TEAM_SIZE = 12;
