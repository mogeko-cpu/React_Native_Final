import { TableOps } from "@/src/core/data/tableOps";
import { Row } from "@/src/core/roble/guard";
import { GroupChatDataSource } from "./GroupChatDataSource";

export abstract class GroupChatTablesDataSource implements GroupChatDataSource {
  protected abstract messages: TableOps;

  readMessages(filters: Record<string, string>) {
    return this.messages.read(filters);
  }
  insertMessage(row: Row) {
    return this.messages.insert(row);
  }
}
