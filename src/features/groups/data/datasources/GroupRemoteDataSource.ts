import { remoteTable, TableOps } from "@/src/core/data/tableOps";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { Tables } from "@/src/core/roble/tables";
import { GroupTablesDataSource } from "./GroupTablesDataSource";

export class GroupRemoteDataSource extends GroupTablesDataSource {
  protected groups: TableOps;
  protected members: TableOps;
  protected requests: TableOps;
  protected invitations: TableOps;
  protected messages: TableOps;

  constructor(client: RobleClient) {
    super();
    this.groups = remoteTable(client, Tables.groups);
    this.members = remoteTable(client, Tables.groupMembers);
    this.requests = remoteTable(client, Tables.groupRequests);
    this.invitations = remoteTable(client, Tables.groupInvitations);
    this.messages = remoteTable(client, Tables.groupMessages);
  }
}
