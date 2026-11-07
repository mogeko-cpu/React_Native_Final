import { localTable, TableOps } from "@/src/core/data/tableOps";
import { DummyData } from "@/src/core/data/dummyData";
import { Tables } from "@/src/core/roble/tables";
import { GroupTablesDataSource } from "./GroupTablesDataSource";

export class GroupInMemoryDataSource extends GroupTablesDataSource {
  protected groups: TableOps;
  protected members: TableOps;
  protected requests: TableOps;
  protected invitations: TableOps;
  protected messages: TableOps;

  constructor(data: DummyData) {
    super();
    this.groups = localTable(data, Tables.groups);
    this.members = localTable(data, Tables.groupMembers);
    this.requests = localTable(data, Tables.groupRequests);
    this.invitations = localTable(data, Tables.groupInvitations);
    this.messages = localTable(data, Tables.groupMessages);
  }
}
