import { DummyData } from "@/src/core/data/dummyData";
import { localTable, TableOps } from "@/src/core/data/tableOps";
import { Row } from "@/src/core/roble/guard";
import { Tables } from "@/src/core/roble/tables";
import { NotificationDataSource } from "./NotificationDataSource";

export class NotificationInMemoryDataSource implements NotificationDataSource {
  private readonly table: TableOps;

  constructor(data: DummyData) {
    this.table = localTable(data, Tables.notifications);
  }

  readForRecipient(userId: string) {
    return this.table.read({ recipient_id: userId });
  }

  insertAll(rows: Row[]) {
    return this.table.insertMany(rows);
  }

  update(id: string, changes: Row) {
    return this.table.update(id, changes);
  }
}
