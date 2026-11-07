import { localTable, TableOps } from "@/src/core/data/tableOps";
import { DummyData } from "@/src/core/data/dummyData";
import { Tables } from "@/src/core/roble/tables";
import { EngagementTablesDataSource } from "./EngagementTablesDataSource";

export class EngagementInMemoryDataSource extends EngagementTablesDataSource {
  protected reactions: TableOps;
  protected views: TableOps;
  protected comments: TableOps;

  constructor(data: DummyData) {
    super();
    this.reactions = localTable(data, Tables.listingReactions);
    this.views = localTable(data, Tables.listingViews);
    this.comments = localTable(data, Tables.listingComments);
  }
}
