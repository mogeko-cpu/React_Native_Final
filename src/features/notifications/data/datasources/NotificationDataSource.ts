import { Row } from "@/src/core/roble/guard";

export interface NotificationDataSource {
  readForRecipient(userId: string): Promise<Row[]>;
  insertAll(rows: Row[]): Promise<void>;
  update(id: string, changes: Row): Promise<void>;
}
