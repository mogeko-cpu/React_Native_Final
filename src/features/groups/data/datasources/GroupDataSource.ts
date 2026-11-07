import { Row } from "@/src/core/roble/guard";

// Grupos, integrantes, solicitudes e invitaciones, en filas.
export interface GroupDataSource {
  readGroups(filters?: Record<string, string>): Promise<Row[]>;
  insertGroup(row: Row): Promise<Row>;
  deleteGroup(id: string): Promise<void>;
  readMembers(filters?: Record<string, string>): Promise<Row[]>;
  insertMember(row: Row): Promise<Row>;
  deleteMember(id: string): Promise<void>;
  readRequests(filters: Record<string, string>): Promise<Row[]>;
  insertRequest(row: Row): Promise<Row>;
  updateRequest(id: string, changes: Row): Promise<void>;
  deleteRequest(id: string): Promise<void>;
  readInvitations(filters: Record<string, string>): Promise<Row[]>;
  insertInvitation(row: Row): Promise<Row>;
  deleteInvitation(id: string): Promise<void>;
  readMessages(filters: Record<string, string>): Promise<Row[]>;
  deleteMessage(id: string): Promise<void>;
}
