import { remoteTable, TableOps } from "@/src/core/data/tableOps";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { Tables } from "@/src/core/roble/tables";
import { EngagementTablesDataSource } from "./EngagementTablesDataSource";

export class EngagementRemoteDataSource extends EngagementTablesDataSource {
  protected reactions: TableOps;
  protected views: TableOps;
  protected comments: TableOps;

  constructor(client: RobleClient) {
    super();
    this.reactions = remoteTable(client, Tables.listingReactions);
    this.views = remoteTable(client, Tables.listingViews);
    this.comments = remoteTable(client, Tables.listingComments);
  }
}
