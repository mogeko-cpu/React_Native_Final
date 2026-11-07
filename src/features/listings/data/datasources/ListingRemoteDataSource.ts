import { remoteTable, TableOps } from "@/src/core/data/tableOps";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { Tables } from "@/src/core/roble/tables";
import { ListingTablesDataSource } from "./ListingTablesDataSource";

export class ListingRemoteDataSource extends ListingTablesDataSource {
  protected listings: TableOps;
  protected members: TableOps;
  protected requests: TableOps;

  constructor(client: RobleClient) {
    super();
    this.listings = remoteTable(client, Tables.listings);
    this.members = remoteTable(client, Tables.listingMembers);
    this.requests = remoteTable(client, Tables.joinRequests);
  }
}
