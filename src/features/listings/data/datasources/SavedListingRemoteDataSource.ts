import { remoteTable, TableOps } from "@/src/core/data/tableOps";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { Tables } from "@/src/core/roble/tables";
import { SavedListingTablesDataSource } from "./SavedListingTablesDataSource";

export class SavedListingRemoteDataSource extends SavedListingTablesDataSource {
  protected saved: TableOps;

  constructor(client: RobleClient) {
    super();
    this.saved = remoteTable(client, Tables.savedListings);
  }
}
