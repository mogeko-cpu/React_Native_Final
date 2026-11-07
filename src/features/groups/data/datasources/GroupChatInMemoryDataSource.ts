import { localTable, TableOps } from "@/src/core/data/tableOps";
import { DummyData } from "@/src/core/data/dummyData";
import { Tables } from "@/src/core/roble/tables";
import { GroupChatTablesDataSource } from "./GroupChatTablesDataSource";

export class GroupChatInMemoryDataSource extends GroupChatTablesDataSource {
  protected messages: TableOps;

  constructor(data: DummyData) {
    super();
    this.messages = localTable(data, Tables.groupMessages);
  }
}
