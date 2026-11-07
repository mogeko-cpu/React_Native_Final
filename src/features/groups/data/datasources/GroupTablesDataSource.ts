import { TableOps } from "@/src/core/data/tableOps";
import { Row } from "@/src/core/roble/guard";
import { GroupDataSource } from "./GroupDataSource";

export abstract class GroupTablesDataSource implements GroupDataSource {
  protected abstract groups: TableOps;
  protected abstract members: TableOps;
  protected abstract requests: TableOps;
  protected abstract invitations: TableOps;
  protected abstract messages: TableOps;

  readGroups(filters?: Record<string, string>) {
    return this.groups.read(filters);
  }
  insertGroup(row: Row) {
    return this.groups.insert(row);
  }
  deleteGroup(id: string) {
    return this.groups.remove(id);
  }
  readMembers(filters?: Record<string, string>) {
    return this.members.read(filters);
  }
  insertMember(row: Row) {
    return this.members.insert(row);
  }
  deleteMember(id: string) {
    return this.members.remove(id);
  }
  readRequests(filters: Record<string, string>) {
    return this.requests.read(filters);
  }
  insertRequest(row: Row) {
    return this.requests.insert(row);
  }
  updateRequest(id: string, changes: Row) {
    return this.requests.update(id, changes);
  }
  deleteRequest(id: string) {
    return this.requests.remove(id);
  }
  readInvitations(filters: Record<string, string>) {
    return this.invitations.read(filters);
  }
  insertInvitation(row: Row) {
    return this.invitations.insert(row);
  }
  deleteInvitation(id: string) {
    return this.invitations.remove(id);
  }
  readMessages(filters: Record<string, string>) {
    return this.messages.read(filters);
  }
  deleteMessage(id: string) {
    return this.messages.remove(id);
  }
}
