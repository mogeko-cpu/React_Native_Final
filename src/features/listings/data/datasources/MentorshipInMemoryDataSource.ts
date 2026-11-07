import { localTable, TableOps } from "@/src/core/data/tableOps";
import { DummyData } from "@/src/core/data/dummyData";
import { Tables } from "@/src/core/roble/tables";
import { MentorshipTablesDataSource } from "./MentorshipTablesDataSource";

export class MentorshipInMemoryDataSource extends MentorshipTablesDataSource {
  protected requests: TableOps;

  constructor(data: DummyData) {
    super();
    this.requests = localTable(data, Tables.mentorshipRequests);
  }
}
