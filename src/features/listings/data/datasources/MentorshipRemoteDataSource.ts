import { remoteTable, TableOps } from "@/src/core/data/tableOps";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { Tables } from "@/src/core/roble/tables";
import { MentorshipTablesDataSource } from "./MentorshipTablesDataSource";

export class MentorshipRemoteDataSource extends MentorshipTablesDataSource {
  protected requests: TableOps;

  constructor(client: RobleClient) {
    super();
    this.requests = remoteTable(client, Tables.mentorshipRequests);
  }
}
