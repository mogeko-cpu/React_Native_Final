import {
  byDateAsc,
  byDateDesc,
  guardRoble,
  intOf,
  isDuplicateRow,
  isRowId,
  nowIso,
  Row,
  str,
  stringsOf,
  translateRobleError,
} from "@/src/core/roble/guard";
import { JoinRequest, JoinRequestStatus, requestStatusFromName } from "../../domain/entities/JoinRequest";
import {
  acceptsRequests,
  isFull,
  isLeader,
  isRecruiting,
  Listing,
  ListingMember,
  ListingRole,
  memberCount,
  roleFromName,
  statusFromName,
  statusLabel,
} from "../../domain/entities/Listing";
import { ListingFailure } from "../../domain/ListingFailure";
import { ListingRepository, MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "../../domain/repositories/ListingRepository";
import { ListingDataSource } from "../datasources/ListingDataSource";

const failure = (message: string) => new ListingFailure(message);

// Los proyectos: decide y traduce, no habla. Junta lo que en Flutter estaba
// repartido entre `roble_listing_source.dart` (agrupar integrantes, ordenar,
// deshacer escrituras a medias) y `listing_repository.dart` (las reglas).
//
// ROBLE no tiene transacciones: cada pareja de escrituras va en el orden que
// deja un estado recuperable si la segunda falla.
export class ListingRepositoryImpl implements ListingRepository {
  constructor(private readonly source: ListingDataSource) {}

  private q<T>(action: () => Promise<T>): Promise<T> {
    return guardRoble(action, failure);
  }

  // ── Lecturas ──────────────────────────────────────────────

  // Dos lecturas completas, y los integrantes se agrupan aquí: `read` solo
  // filtra por igualdad, no hace JOIN.
  async getListings(): Promise<Listing[]> {
    const rows = await this.q(() => this.source.readListings());
    const memberRows = await this.q(() => this.source.readMembers());
    const byListing = new Map<string, Row[]>();
    for (const row of memberRows) {
      const listingId = str(row.listing_id);
      if (!listingId || row.user_id == null) continue;
      byListing.set(listingId, [...(byListing.get(listingId) ?? []), row]);
    }
    return rows
      .sort(byDateDesc("created_at"))
      .map((row) => toListing(row, byListing.get(str(row._id)) ?? []))
      .filter((l): l is Listing => l != null);
  }

  async getFeaturedListings(): Promise<Listing[]> {
    return (await this.getListings()).filter(isRecruiting).slice(0, 5);
  }

  async getListingById(id: string): Promise<Listing | null> {
    if (!isRowId(id)) return null;
    const rows = await this.q(() => this.source.readListings({ _id: id }));
    if (rows.length === 0) return null;
    const members = (await this.q(() => this.source.readMembers({ listing_id: id }))).filter((r) => r.user_id != null);
    return toListing(rows[0], members);
  }

  async getMyListings(userId: string) {
    return (await this.getListings()).filter((l) => l.creatorId === userId);
  }

  async getJoinedListings(userId: string) {
    return (await this.getListings()).filter((l) => l.memberIds.includes(userId));
  }

  async getListingsByGroup(groupId: string) {
    if (!groupId) return [];
    return (await this.getListings()).filter((l) => l.groupId === groupId);
  }

  // ── Publicar ──────────────────────────────────────────────

  // Dos escrituras: la fila y la membresía del creador. Si la segunda falla, la
  // primera se borra: un proyecto sin nadie adentro no tiene pantalla que lo
  // arregle.
  async createListing(draft: Listing): Promise<Listing> {
    const row = await this.q(() =>
      this.source.insertListing({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        creator_id: draft.creatorId,
        creator_name: draft.creatorName,
        max_members: draft.maxMembers,
        required_skills: draft.requiredSkills,
        group_id: draft.groupId,
        group_name: draft.groupName,
        status: draft.status,
        created_at: nowIso(),
      }),
    );
    const id = str(row._id);
    if (!id) {
      throw failure("ROBLE guardó el proyecto pero no devolvió su identificador. Recarga la lista antes de volver a publicarlo.");
    }
    try {
      await this.addMemberRow(id, draft.creatorId, draft.creatorName, "leader");
    } catch (e) {
      await this.source.deleteListing(id).catch(() => undefined);
      throw e;
    }
    return {
      ...draft,
      id,
      memberIds: [draft.creatorId],
      members: [{ userId: draft.creatorId, userName: draft.creatorName, role: "leader" }],
    };
  }

  // ── Solicitudes ───────────────────────────────────────────

  async createJoinRequest(request: Omit<JoinRequest, "id" | "status">): Promise<JoinRequest> {
    const listing = await this.getListingById(request.listingId);
    // Se revisa aquí y no solo en la pantalla: el botón puede estar viejo.
    if (listing && !acceptsRequests(listing.status)) {
      throw failure(`Este proyecto está ${statusLabel(listing.status).toLowerCase()} y ya no recibe solicitudes.`);
    }
    try {
      const row = await this.source.insertJoinRequest({
        listing_id: request.listingId,
        applicant_id: request.applicantId,
        applicant_name: request.applicantName,
        motivation: request.motivation,
        skills: request.skills,
        availability: request.availability,
        status: "pending",
        created_at: nowIso(),
      });
      return { ...request, id: str(row._id), status: "pending" };
    } catch (e) {
      if (isDuplicateRow(e)) throw failure("Ya enviaste una solicitud a este proyecto.");
      throw translateRobleError(e, failure);
    }
  }

  async getRequestsForListing(listingId: string): Promise<JoinRequest[]> {
    if (!isRowId(listingId)) return [];
    const rows = await this.q(() => this.source.readJoinRequests({ listing_id: listingId }));
    return rows.sort(byDateAsc("created_at")).map(toRequest).filter((r): r is JoinRequest => r != null);
  }

  async getMyRequestForListing(listingId: string, applicantId: string) {
    return (await this.getRequestsForListing(listingId)).find((r) => r.applicantId === applicantId) ?? null;
  }

  async getMyRequests(applicantId: string): Promise<JoinRequest[]> {
    const rows = await this.q(() => this.source.readJoinRequests({ applicant_id: applicantId }));
    return rows.sort(byDateDesc("created_at")).map(toRequest).filter((r): r is JoinRequest => r != null);
  }

  // Primero entra la persona y después la solicitud se marca aceptada. Si falla
  // la segunda, la solicitud sigue «Pendiente» y aceptarla otra vez lo arregla
  // (agregar es idempotente). Al revés quedaría aceptada sin integrante.
  async acceptJoinRequest(requestId: string): Promise<void> {
    const request = await this.requestById(requestId);
    if (!request) throw failure("Esta solicitud ya no existe.");
    const listing = await this.getListingById(request.listingId);
    if (listing && !acceptsRequests(listing.status)) {
      throw failure(`Este proyecto está ${statusLabel(listing.status).toLowerCase()}: ya no se aceptan integrantes nuevos.`);
    }
    await this.addMember(request.listingId, request.applicantId, request.applicantName, "member");
    await this.setRequestStatus(requestId, "accepted");
  }

  rejectJoinRequest(requestId: string) {
    return this.setRequestStatus(requestId, "rejected");
  }

  async closePendingRequests(listingId: string): Promise<JoinRequest[]> {
    const pending = (await this.getRequestsForListing(listingId)).filter((r) => r.status === "pending");
    for (const request of pending) await this.setRequestStatus(request.id, "rejected");
    return pending;
  }

  // ── Editar y borrar ───────────────────────────────────────

  async updateListing(updated: Listing, actorId: string): Promise<Listing> {
    const current = await this.requireListing(updated.id);
    requireLeader(current, actorId, "editar el proyecto");
    const title = updated.title.trim();
    const description = updated.description.trim();
    if (title.length < 5) throw failure("El título debe tener al menos 5 caracteres.");
    if (description.length < 20) throw failure("La descripción debe tener al menos 20 caracteres.");
    if (updated.maxMembers < MIN_TEAM_SIZE || updated.maxMembers > MAX_TEAM_SIZE) {
      throw failure(`El equipo debe ser de ${MIN_TEAM_SIZE} a ${MAX_TEAM_SIZE} personas.`);
    }
    // Achicar por debajo de quienes ya están dejaría a alguien sobrando sin
    // regla de quién sale: el líder quita a alguien primero.
    if (updated.maxMembers < memberCount(current)) {
      throw failure(`El equipo ya tiene ${memberCount(current)} personas: el tamaño no puede ser menor.`);
    }
    // Del formulario solo se toma lo que el formulario edita: quién está y quién
    // lidera salen de la fila guardada.
    await this.q(() =>
      this.source.updateListing(current.id, {
        title,
        description,
        category: updated.category,
        max_members: updated.maxMembers,
        required_skills: updated.requiredSkills,
        status: updated.status,
      }),
    );
    const stored = await this.getListingById(current.id);
    if (!stored) throw failure(`El proyecto ${current.id} ya no existe.`);
    return stored;
  }

  // Sin cascadas: primero los hijos, después el proyecto.
  async deleteListing(listingId: string): Promise<void> {
    if (!isRowId(listingId)) throw failure(`El proyecto ${listingId} ya no existe.`);
    for (const row of await this.q(() => this.source.readMembers({ listing_id: listingId }))) {
      await this.q(() => this.source.deleteMember(str(row._id)));
    }
    for (const row of await this.q(() => this.source.readJoinRequests({ listing_id: listingId }))) {
      await this.q(() => this.source.deleteJoinRequest(str(row._id)));
    }
    await this.q(() => this.source.deleteListing(listingId));
  }

  // ── Equipo ────────────────────────────────────────────────

  async removeMember({ listingId, userId, actorId }: { listingId: string; userId: string; actorId: string }) {
    const listing = await this.requireListing(listingId);
    requireLeader(listing, actorId, "quitar integrantes");
    if (isLeader(listing, userId)) throw failure("No se puede quitar al líder. Transfiere el liderazgo primero.");
    if (!listing.memberIds.includes(userId)) throw failure("Esa persona ya no está en el equipo.");
    await this.removeMemberRows(listingId, userId);
  }

  async leaveListing({ listingId, userId }: { listingId: string; userId: string }) {
    const listing = await this.requireListing(listingId);
    if (!listing.memberIds.includes(userId)) return;
    // Un proyecto sin nadie a cargo no tiene pantalla que lo arregle.
    if (isLeader(listing, userId)) throw failure("Eres el líder: transfiere el liderazgo antes de salir del proyecto.");
    await this.removeMemberRows(listingId, userId);
  }

  async setMemberRole({ listingId, userId, role, actorId }: { listingId: string; userId: string; role: ListingRole; actorId: string }) {
    if (role === "leader") throw failure('El liderazgo se transfiere, no se asigna: usa "Transferir liderazgo".');
    const listing = await this.requireListing(listingId);
    requireLeader(listing, actorId, "cambiar roles");
    if (isLeader(listing, userId)) throw failure("El líder no puede cambiar su propio rol. Transfiere el liderazgo primero.");
    if (!listing.memberIds.includes(userId)) throw failure("Esa persona ya no está en el equipo.");
    await this.writeRole(listingId, userId, role);
  }

  addMentor({ listingId, userId, userName }: { listingId: string; userId: string; userName: string }) {
    return this.addMember(listingId, userId, userName, "mentor");
  }

  // Se promueve **primero** al nuevo líder: si la segunda escritura falla quedan
  // dos líderes, que pueden terminar el cambio; al revés quedaría un proyecto
  // sin nadie a cargo.
  async transferLeadership({ listingId, newLeaderId, actorId }: { listingId: string; newLeaderId: string; actorId: string }) {
    const listing = await this.requireListing(listingId);
    requireLeader(listing, actorId, "transferir el liderazgo");
    if (newLeaderId === actorId) return;
    if (!listing.memberIds.includes(newLeaderId)) throw failure("Esa persona ya no está en el equipo.");
    await this.writeRole(listingId, newLeaderId, "leader");
    await this.writeRole(listingId, actorId, "member");
  }

  // ── Plomería ──────────────────────────────────────────────

  private async requireListing(listingId: string): Promise<Listing> {
    const listing = await this.getListingById(listingId);
    if (!listing) throw failure(`El proyecto ${listingId} ya no existe.`);
    return listing;
  }

  private async requestById(id: string): Promise<JoinRequest | null> {
    if (!isRowId(id)) return null;
    const rows = await this.q(() => this.source.readJoinRequests({ _id: id }));
    return rows.length === 0 ? null : toRequest(rows[0]);
  }

  private setRequestStatus(requestId: string, status: JoinRequestStatus) {
    return this.q(() => this.source.updateJoinRequest(requestId, { status }));
  }

  private async addMember(listingId: string, userId: string, userName: string, role: ListingRole) {
    const listing = await this.getListingById(listingId);
    if (!listing) throw failure(`El proyecto ${listingId} ya no existe.`);
    if (listing.memberIds.includes(userId)) return;
    if (role !== "mentor" && isFull(listing)) throw failure("El proyecto ya alcanzó su número máximo de integrantes.");
    await this.addMemberRow(listingId, userId, userName, role);
  }

  // Unirse dos veces no es un error: si el `UNIQUE` rechaza el `INSERT`, ser
  // integrante es justo lo que se quería.
  private async addMemberRow(listingId: string, userId: string, userName: string, role: ListingRole) {
    try {
      await this.source.insertMember({ listing_id: listingId, user_id: userId, user_name: userName, role, joined_at: nowIso() });
    } catch (e) {
      if (isDuplicateRow(e)) return;
      throw translateRobleError(e, failure);
    }
  }

  private async removeMemberRows(listingId: string, userId: string) {
    if (!isRowId(listingId)) return;
    const rows = await this.q(() => this.source.readMembers({ listing_id: listingId }));
    for (const row of rows) {
      if (str(row.user_id) !== userId || !row._id) continue;
      await this.q(() => this.source.deleteMember(str(row._id)));
    }
  }

  private async writeRole(listingId: string, userId: string, role: ListingRole) {
    if (!isRowId(listingId)) throw failure(`El proyecto ${listingId} ya no existe.`);
    const rows = await this.q(() => this.source.readMembers({ listing_id: listingId }));
    const id = str(rows.find((r) => str(r.user_id) === userId)?._id);
    if (!id) throw failure("Esa persona ya no está en el equipo.");
    await this.q(() => this.source.updateMember(id, { role }));
  }
}

function requireLeader(listing: Listing, actorId: string, action: string) {
  if (!isLeader(listing, actorId)) throw failure(`Solo el líder del proyecto puede ${action}.`);
}

function toListing(row: Row, memberRows: Row[]): Listing | null {
  const id = str(row._id);
  if (!id) return null;
  const creatorId = str(row.creator_id);
  const creatorName = str(row.creator_name);
  const members: ListingMember[] = [];
  for (const member of memberRows) {
    const role = roleFromName(member.role);
    if (!role) continue;
    const userId = str(member.user_id);
    const name = str(member.user_name);
    members.push({ userId, userName: name || (userId === creatorId ? creatorName : ""), role });
  }
  return {
    id,
    title: str(row.title),
    description: str(row.description),
    category: str(row.category),
    creatorId,
    creatorName,
    maxMembers: intOf(row.max_members, 1),
    requiredSkills: stringsOf(row.required_skills),
    memberIds: memberRows.map((m) => str(m.user_id)),
    groupId: str(row.group_id),
    groupName: str(row.group_name),
    status: statusFromName(row.status),
    members,
  };
}

function toRequest(row: Row): JoinRequest | null {
  const id = str(row._id);
  const listingId = str(row.listing_id);
  if (!id || !listingId) return null;
  return {
    id,
    listingId,
    applicantId: str(row.applicant_id),
    applicantName: str(row.applicant_name),
    motivation: str(row.motivation),
    skills: str(row.skills),
    availability: str(row.availability),
    status: requestStatusFromName(row.status),
  };
}
