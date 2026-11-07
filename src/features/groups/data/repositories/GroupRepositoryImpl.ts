import { byDateAsc, byDateDesc, guardRoble, isDuplicateRow, isRowId, nowIso, Row, str, translateRobleError } from "@/src/core/roble/guard";
import { Group, GroupInvitation, GroupMember, GroupRequest, hasMember, isOwner, isPending } from "../../domain/entities/Group";
import { GroupFailure } from "../../domain/GroupFailure";
import { GroupRepository } from "../../domain/repositories/GroupRepository";
import { GroupDataSource } from "../datasources/GroupDataSource";

const failure = (message: string) => new GroupFailure(message);

// Los grupos (`roble_group_source.dart` + `group_repository.dart`). Los
// integrantes son filas por la misma razón que los de un proyecto: sin
// transacciones, dos aceptaciones simultáneas se pisarían en un arreglo.
export class GroupRepositoryImpl implements GroupRepository {
  constructor(private readonly source: GroupDataSource) {}

  private q<T>(action: () => Promise<T>): Promise<T> {
    return guardRoble(action, failure);
  }

  // ── Lecturas ──────────────────────────────────────────────

  async getGroups(): Promise<Group[]> {
    const rows = await this.q(() => this.source.readGroups());
    const memberRows = await this.q(() => this.source.readMembers());
    const byGroup = new Map<string, GroupMember[]>();
    for (const row of memberRows) {
      const member = toMember(row);
      if (!member) continue;
      byGroup.set(member.groupId, [...(byGroup.get(member.groupId) ?? []), member]);
    }
    return rows
      .sort(byDateDesc("created_at"))
      .map((row) => toGroup(row, byGroup.get(str(row._id)) ?? []))
      .filter((g): g is Group => g != null);
  }

  async getMyGroups(userId: string): Promise<Group[]> {
    const mine = (await this.getGroups()).filter((g) => isOwner(g, userId) || hasMember(g, userId));
    return mine.sort((a, b) => (isOwner(a, userId) ? 0 : 1) - (isOwner(b, userId) ? 0 : 1));
  }

  async getGroupById(id: string): Promise<Group | null> {
    if (!isRowId(id)) return null;
    const rows = await this.q(() => this.source.readGroups({ _id: id }));
    if (rows.length === 0) return null;
    const members = (await this.q(() => this.source.readMembers({ group_id: id }))).map(toMember).filter((m): m is GroupMember => m != null);
    return toGroup(rows[0], members);
  }

  // ── Crear y borrar ────────────────────────────────────────

  // La fila y la membresía del dueño; si la segunda falla, la primera se borra.
  async createGroup(draft: { name: string; description: string; ownerId: string; ownerName: string }): Promise<Group> {
    const row = await this.q(() =>
      this.source.insertGroup({
        name: draft.name,
        description: draft.description,
        owner_id: draft.ownerId,
        owner_name: draft.ownerName,
        created_at: nowIso(),
      }),
    );
    const id = str(row._id);
    if (!id) throw failure("ROBLE guardó el grupo pero no devolvió su identificador. Recarga la lista antes de volver a crearlo.");
    try {
      await this.addMemberRow(id, draft.ownerId, draft.ownerName);
    } catch (e) {
      await this.source.deleteGroup(id).catch(() => undefined);
      throw e;
    }
    return { id, ...draft, members: [{ id: "", groupId: id, userId: draft.ownerId, userName: draft.ownerName }] };
  }

  // Eliminar un grupo **no** elimina sus proyectos: la pantalla se niega
  // mientras tenga alguno. Aquí se borra lo que es solo del grupo.
  async deleteGroup(groupId: string): Promise<void> {
    if (!isRowId(groupId)) throw failure(`El grupo ${groupId} ya no existe.`);
    const filter = { group_id: groupId };
    for (const row of await this.q(() => this.source.readMembers(filter))) await this.q(() => this.source.deleteMember(str(row._id)));
    for (const row of await this.q(() => this.source.readRequests(filter))) await this.q(() => this.source.deleteRequest(str(row._id)));
    for (const row of await this.q(() => this.source.readInvitations(filter))) await this.q(() => this.source.deleteInvitation(str(row._id)));
    for (const row of await this.q(() => this.source.readMessages(filter))) await this.q(() => this.source.deleteMessage(str(row._id)));
    await this.q(() => this.source.deleteGroup(groupId));
  }

  // ── Solicitudes ───────────────────────────────────────────

  async requestToJoin(request: { groupId: string; applicantId: string; applicantName: string; message: string }): Promise<GroupRequest> {
    const group = await this.getGroupById(request.groupId);
    if (!group) throw failure("Este grupo ya no existe.");
    if (hasMember(group, request.applicantId)) throw failure("Ya haces parte de este grupo.");
    // Una solicitud vieja ya respondida se borra: si no, el `UNIQUE` impediría
    // volver a pedir entrada.
    for (const existing of (await this.getRequestsForGroup(request.groupId)).filter((r) => r.applicantId === request.applicantId)) {
      if (isPending(existing)) throw failure("Ya enviaste una solicitud a este grupo.");
      await this.q(() => this.source.deleteRequest(existing.id));
    }
    const invitations = await this.getMyInvitations(request.applicantId);
    if (invitations.some((i) => i.groupId === request.groupId)) {
      throw failure("Este grupo ya te invitó. Acepta la invitación desde la pestaña Grupos.");
    }
    try {
      const row = await this.source.insertRequest({
        group_id: request.groupId,
        applicant_id: request.applicantId,
        applicant_name: request.applicantName,
        message: request.message,
        status: "pending",
        created_at: nowIso(),
      });
      return { ...request, id: str(row._id), status: "pending" };
    } catch (e) {
      if (isDuplicateRow(e)) throw failure("Ya enviaste una solicitud a este grupo.");
      throw translateRobleError(e, failure);
    }
  }

  async getRequestsForGroup(groupId: string): Promise<GroupRequest[]> {
    if (!isRowId(groupId)) return [];
    const rows = await this.q(() => this.source.readRequests({ group_id: groupId }));
    return rows.sort(byDateAsc("created_at")).map(toRequest).filter((r): r is GroupRequest => r != null);
  }

  async getMyRequestForGroup(groupId: string, applicantId: string) {
    return (await this.getRequestsForGroup(groupId)).find((r) => r.applicantId === applicantId && isPending(r)) ?? null;
  }

  async getMyRequests(applicantId: string): Promise<GroupRequest[]> {
    const rows = await this.q(() => this.source.readRequests({ applicant_id: applicantId }));
    return rows.sort(byDateDesc("created_at")).map(toRequest).filter((r): r is GroupRequest => r != null && isPending(r));
  }

  // Primero entra la persona, después se borra la solicitud.
  async acceptRequest(requestId: string): Promise<GroupRequest> {
    const request = await this.requireRequest(requestId);
    await this.addMember(request.groupId, request.applicantId, request.applicantName);
    await this.q(() => this.source.deleteRequest(requestId));
    return request;
  }

  async rejectRequest(requestId: string): Promise<GroupRequest> {
    const request = await this.requireRequest(requestId);
    await this.q(() => this.source.deleteRequest(requestId));
    return request;
  }

  // ── Invitaciones ──────────────────────────────────────────

  async inviteUser(invitation: Omit<GroupInvitation, "id">): Promise<GroupInvitation> {
    const group = await this.getGroupById(invitation.groupId);
    if (!group) throw failure("Este grupo ya no existe.");
    if (!hasMember(group, invitation.inviterId)) throw failure("Solo las personas del grupo pueden invitar a otras.");
    if (hasMember(group, invitation.inviteeId)) throw failure("Esta persona ya hace parte del grupo.");
    const requests = await this.getRequestsForGroup(invitation.groupId);
    if (requests.some((r) => r.applicantId === invitation.inviteeId && isPending(r))) {
      throw failure("Esta persona ya pidió entrar al grupo; su solicitud está pendiente de revisión.");
    }
    try {
      const row = await this.source.insertInvitation({
        group_id: invitation.groupId,
        group_name: invitation.groupName,
        inviter_id: invitation.inviterId,
        inviter_name: invitation.inviterName,
        invitee_id: invitation.inviteeId,
        invitee_name: invitation.inviteeName,
        created_at: nowIso(),
      });
      return { ...invitation, id: str(row._id) };
    } catch (e) {
      if (isDuplicateRow(e)) throw failure("Esta persona ya tiene una invitación pendiente a este grupo.");
      throw translateRobleError(e, failure);
    }
  }

  async getInvitationsForGroup(groupId: string): Promise<GroupInvitation[]> {
    if (!isRowId(groupId)) return [];
    const rows = await this.q(() => this.source.readInvitations({ group_id: groupId }));
    return rows.sort(byDateAsc("created_at")).map(toInvitation).filter((i): i is GroupInvitation => i != null);
  }

  async getMyInvitations(inviteeId: string): Promise<GroupInvitation[]> {
    const rows = await this.q(() => this.source.readInvitations({ invitee_id: inviteeId }));
    return rows.sort(byDateDesc("created_at")).map(toInvitation).filter((i): i is GroupInvitation => i != null);
  }

  // Al aceptar se borra también cualquier solicitud que la persona tuviera.
  async acceptInvitation(invitationId: string): Promise<GroupInvitation> {
    const invitation = await this.requireInvitation(invitationId);
    await this.addMember(invitation.groupId, invitation.inviteeId, invitation.inviteeName);
    await this.q(() => this.source.deleteInvitation(invitationId));
    for (const request of await this.getRequestsForGroup(invitation.groupId)) {
      if (request.applicantId === invitation.inviteeId) await this.q(() => this.source.deleteRequest(request.id));
    }
    return invitation;
  }

  async rejectInvitation(invitationId: string): Promise<GroupInvitation> {
    const invitation = await this.requireInvitation(invitationId);
    await this.q(() => this.source.deleteInvitation(invitationId));
    return invitation;
  }

  cancelInvitation(invitationId: string) {
    return this.q(() => this.source.deleteInvitation(invitationId));
  }

  async removeMember({ groupId, userId }: { groupId: string; userId: string }) {
    const group = await this.getGroupById(groupId);
    if (!group) throw failure("Este grupo ya no existe.");
    if (isOwner(group, userId)) throw failure("El creador no puede salir del grupo. Elimina el grupo si ya no lo necesitas.");
    for (const row of await this.q(() => this.source.readMembers({ group_id: groupId, user_id: userId }))) {
      if (row._id) await this.q(() => this.source.deleteMember(str(row._id)));
    }
  }

  // ── Plomería ──────────────────────────────────────────────

  private async addMember(groupId: string, userId: string, userName: string) {
    const group = await this.getGroupById(groupId);
    if (!group) throw failure(`El grupo ${groupId} ya no existe.`);
    if (hasMember(group, userId)) return;
    await this.addMemberRow(groupId, userId, userName);
  }

  private async addMemberRow(groupId: string, userId: string, userName: string) {
    try {
      await this.source.insertMember({ group_id: groupId, user_id: userId, user_name: userName, joined_at: nowIso() });
    } catch (e) {
      if (isDuplicateRow(e)) return;
      throw translateRobleError(e, failure);
    }
  }

  private async requireRequest(requestId: string): Promise<GroupRequest> {
    const rows = isRowId(requestId) ? await this.q(() => this.source.readRequests({ _id: requestId })) : [];
    const request = rows.length > 0 ? toRequest(rows[0]) : null;
    if (!request) throw failure("Esta solicitud ya no existe.");
    return request;
  }

  private async requireInvitation(invitationId: string): Promise<GroupInvitation> {
    const rows = isRowId(invitationId) ? await this.q(() => this.source.readInvitations({ _id: invitationId })) : [];
    const invitation = rows.length > 0 ? toInvitation(rows[0]) : null;
    if (!invitation) throw failure("Esta invitación ya no existe.");
    return invitation;
  }
}

function toGroup(row: Row, members: GroupMember[]): Group | null {
  const id = str(row._id);
  if (!id) return null;
  return {
    id,
    name: str(row.name),
    description: str(row.description),
    ownerId: str(row.owner_id),
    ownerName: str(row.owner_name),
    members,
  };
}

function toMember(row: Row): GroupMember | null {
  const groupId = str(row.group_id);
  const userId = str(row.user_id);
  if (!groupId || !userId) return null;
  return { id: str(row._id), groupId, userId, userName: str(row.user_name, "Estudiante") };
}

function toRequest(row: Row): GroupRequest | null {
  const id = str(row._id);
  const groupId = str(row.group_id);
  if (!id || !groupId) return null;
  const status = row.status === "accepted" || row.status === "rejected" ? row.status : "pending";
  return { id, groupId, applicantId: str(row.applicant_id), applicantName: str(row.applicant_name), message: str(row.message), status };
}

function toInvitation(row: Row): GroupInvitation | null {
  const id = str(row._id);
  const groupId = str(row.group_id);
  if (!id || !groupId) return null;
  return {
    id,
    groupId,
    groupName: str(row.group_name),
    inviterId: str(row.inviter_id),
    inviterName: str(row.inviter_name, "Un integrante"),
    inviteeId: str(row.invitee_id),
    inviteeName: str(row.invitee_name, "Estudiante"),
  };
}
