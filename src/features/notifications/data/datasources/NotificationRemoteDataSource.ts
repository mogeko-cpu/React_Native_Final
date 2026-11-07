import { remoteTable, TableOps } from "@/src/core/data/tableOps";
import { Row } from "@/src/core/roble/guard";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { Tables } from "@/src/core/roble/tables";
import { NotificationDataSource } from "./NotificationDataSource";

// La tabla propia `notifications` (la misma de la versión Flutter), no la
// bandeja de `roble-client`: así las dos apps ven los mismos avisos.
export class NotificationRemoteDataSource implements NotificationDataSource {
  private readonly table: TableOps;

  constructor(client: RobleClient) {
    this.table = remoteTable(client, Tables.notifications);
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
