import { TableOps } from "@/src/core/data/tableOps";
import { Row } from "@/src/core/roble/guard";
import { MentorshipDataSource } from "./MentorshipDataSource";

export abstract class MentorshipTablesDataSource implements MentorshipDataSource {
  protected abstract requests: TableOps;

  readRequests(filters: Record<string, string>) {
    return this.requests.read(filters);
  }
  insertRequest(row: Row) {
    return this.requests.insert(row);
  }
  deleteRequest(id: string) {
    return this.requests.remove(id);
  }
}
