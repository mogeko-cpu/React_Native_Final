import { byDateAsc, byDateDesc, guardRoble, isDuplicateRow, isRowId, nowIso, parseDate, Row, str, translateRobleError } from "@/src/core/roble/guard";
import { canWorkTasks, hasMentor, Listing, roleOf } from "../../domain/entities/Listing";
import { MentorshipRequest } from "../../domain/entities/MentorshipRequest";
import { ListingFailure } from "../../domain/ListingFailure";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { MAX_MENTORSHIP_MESSAGE, MentorshipRepository } from "../../domain/repositories/MentorshipRepository";
import { MentorshipDataSource } from "../datasources/MentorshipDataSource";

const failure = (message: string) => new ListingFailure(message);

// La mentoría (`mentorship_repository.dart`). La pide el líder o un
// integrante, a alguien de afuera del equipo, mientras el proyecto no tenga
// mentor. Una por proyecto, y el `UNIQUE (listing_id)` es quien lo garantiza.
export class MentorshipRepositoryImpl implements MentorshipRepository {
  constructor(
    private readonly source: MentorshipDataSource,
    private readonly listings: ListingRepository,
  ) {}

  private q<T>(action: () => Promise<T>): Promise<T> {
    return guardRoble(action, failure);
  }

  async getPendingFor(listingId: string): Promise<MentorshipRequest | null> {
    if (!isRowId(listingId)) return null;
    const rows = await this.q(() => this.source.readRequests({ listing_id: listingId }));
    return rows.sort(byDateAsc("created_at")).map(toRequest).find((r) => r != null) ?? null;
  }

  async getMyInvitations(mentorId: string): Promise<MentorshipRequest[]> {
    if (!mentorId) return [];
    const rows = await this.q(() => this.source.readRequests({ mentor_id: mentorId }));
    return rows.sort(byDateDesc("created_at")).map(toRequest).filter((r): r is MentorshipRequest => r != null);
  }

  async request(draft: Omit<MentorshipRequest, "id" | "createdAt">): Promise<MentorshipRequest> {
    const message = draft.message.trim();
    if (!draft.mentorId) throw failure("Elige a la persona que quieres como mentor.");
    if (!message) throw failure("Cuéntale a la persona en qué necesita acompañamiento el equipo.");
    if (message.length > MAX_MENTORSHIP_MESSAGE) throw failure(`El mensaje es muy largo. Máximo ${MAX_MENTORSHIP_MESSAGE} caracteres.`);
    const listing = await this.requireListing(draft.listingId);
    if (!canWorkTasks(roleOf(listing, draft.requesterId))) throw failure("Solo el líder y los integrantes pueden solicitar mentoría.");
    if (roleOf(listing, draft.mentorId) != null) {
      throw failure("Esa persona ya hace parte del equipo. La mentoría es para alguien de afuera que acompañe el proyecto.");
    }
    if (hasMentor(listing)) throw failure("Este proyecto ya tiene mentor.");
    const pending = await this.getPendingFor(draft.listingId);
    if (pending) throw failure(`Ya hay una solicitud de mentoría pendiente para ${pending.mentorName}.`);
    const createdAt = new Date();
    try {
      const row = await this.source.insertRequest({
        listing_id: draft.listingId,
        listing_title: listing.title,
        requester_id: draft.requesterId,
        requester_name: draft.requesterName,
        mentor_id: draft.mentorId,
        mentor_name: draft.mentorName,
        message,
        created_at: createdAt.toISOString() || nowIso(),
      });
      return { ...draft, id: str(row._id), message, listingTitle: listing.title, createdAt };
    } catch (e) {
      if (isDuplicateRow(e)) throw failure("Este proyecto ya tiene una solicitud de mentoría pendiente.");
      throw translateRobleError(e, failure);
    }
  }

  // Dos escrituras, en el orden de aceptar una solicitud de unirse: primero
  // entra el mentor, después se borra la solicitud.
  async accept({ requestId, actorId }: { requestId: string; actorId: string }) {
    const request = await this.requireRequest(requestId);
    checkIsAsked(request, actorId);
    await this.listings.addMentor({ listingId: request.listingId, userId: request.mentorId, userName: request.mentorName });
    await this.q(() => this.source.deleteRequest(requestId));
    return request;
  }

  async reject({ requestId, actorId }: { requestId: string; actorId: string }) {
    const request = await this.requireRequest(requestId);
    checkIsAsked(request, actorId);
    await this.q(() => this.source.deleteRequest(requestId));
    return request;
  }

  async cancel({ requestId, actorId }: { requestId: string; actorId: string }) {
    const request = await this.requireRequest(requestId);
    if (actorId !== request.requesterId) {
      const listing = await this.listings.getListingById(request.listingId);
      if (!listing || roleOf(listing, actorId) !== "leader") {
        throw failure("Solo quien envió la solicitud o el líder del proyecto pueden cancelarla.");
      }
    }
    await this.q(() => this.source.deleteRequest(requestId));
  }

  async purgeListing(listingId: string) {
    if (!isRowId(listingId)) return;
    for (const row of await this.q(() => this.source.readRequests({ listing_id: listingId }))) {
      await this.q(() => this.source.deleteRequest(str(row._id)));
    }
  }

  private async requireListing(listingId: string): Promise<Listing> {
    const listing = await this.listings.getListingById(listingId);
    if (!listing) throw failure("Este proyecto ya no existe.");
    return listing;
  }

  private async requireRequest(requestId: string): Promise<MentorshipRequest> {
    const rows = isRowId(requestId) ? await this.q(() => this.source.readRequests({ _id: requestId })) : [];
    const request = rows.length > 0 ? toRequest(rows[0]) : null;
    if (!request) throw failure("Esta solicitud de mentoría ya no existe.");
    return request;
  }
}

function checkIsAsked(request: MentorshipRequest, actorId: string) {
  if (request.mentorId !== actorId) throw failure("Solo la persona a quien se le pidió la mentoría puede responderla.");
}

function toRequest(row: Row): MentorshipRequest | null {
  const id = str(row._id);
  const listingId = str(row.listing_id);
  if (!id || !listingId) return null;
  return {
    id,
    listingId,
    listingTitle: str(row.listing_title),
    requesterId: str(row.requester_id),
    requesterName: str(row.requester_name, "Integrante"),
    mentorId: str(row.mentor_id),
    mentorName: str(row.mentor_name, "Mentor"),
    message: str(row.message),
    createdAt: parseDate(row.created_at),
  };
}
