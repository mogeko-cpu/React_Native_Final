import { remoteTable, TableOps } from "@/src/core/data/tableOps";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { Tables } from "@/src/core/roble/tables";
import { GroupChatTablesDataSource } from "./GroupChatTablesDataSource";

export class GroupChatRemoteDataSource extends GroupChatTablesDataSource {
  protected messages: TableOps;

  constructor(client: RobleClient) {
    super();
    this.messages = remoteTable(client, Tables.groupMessages);
  }
}
