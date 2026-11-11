import { Row } from "@/src/core/roble/guard";

// Los proyectos guardados (`saved_listings`), en filas: una por persona y
// proyecto, con `UNIQUE (user_id, listing_id)`.
export interface SavedListingDataSource {
  readSaved(filters: Record<string, string>): Promise<Row[]>;
  insertSaved(row: Row): Promise<Row>;
  deleteSaved(id: string): Promise<void>;
}
