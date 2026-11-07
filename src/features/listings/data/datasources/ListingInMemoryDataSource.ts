import { DummyData } from "@/src/core/data/dummyData";
import { localTable, TableOps } from "@/src/core/data/tableOps";
import { Tables } from "@/src/core/roble/tables";
import { ListingTablesDataSource } from "./ListingTablesDataSource";

export class ListingInMemoryDataSource extends ListingTablesDataSource {
  protected listings: TableOps;
  protected members: TableOps;
  protected requests: TableOps;

  constructor(data: DummyData) {
    super();
    this.listings = localTable(data, Tables.listings);
    this.members = localTable(data, Tables.listingMembers);
    this.requests = localTable(data, Tables.joinRequests);
  }
}
