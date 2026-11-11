import { TableOps } from "@/src/core/data/tableOps";
import { Row } from "@/src/core/roble/guard";
import { SavedListingDataSource } from "./SavedListingDataSource";

export abstract class SavedListingTablesDataSource implements SavedListingDataSource {
  protected abstract saved: TableOps;

  readSaved(filters: Record<string, string>) {
    return this.saved.read(filters);
  }
  insertSaved(row: Row) {
    return this.saved.insert(row);
  }
  deleteSaved(id: string) {
    return this.saved.remove(id);
  }
}
