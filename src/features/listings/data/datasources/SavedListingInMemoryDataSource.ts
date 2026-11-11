import { localTable, TableOps } from "@/src/core/data/tableOps";
import { DummyData } from "@/src/core/data/dummyData";
import { Tables } from "@/src/core/roble/tables";
import { SavedListingTablesDataSource } from "./SavedListingTablesDataSource";

export class SavedListingInMemoryDataSource extends SavedListingTablesDataSource {
  protected saved: TableOps;

  constructor(data: DummyData) {
    super();
    this.saved = localTable(data, Tables.savedListings);
  }
}
