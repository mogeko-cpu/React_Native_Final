import { Row } from "@/src/core/roble/guard";

// Proyectos, equipos y solicitudes, en filas (`listings`, `listing_members`,
// `join_requests`). Decide nada y deja subir las excepciones.
export interface ListingDataSource {
  readListings(filters?: Record<string, string>): Promise<Row[]>;
  insertListing(row: Row): Promise<Row>;
  updateListing(id: string, changes: Row): Promise<void>;
  deleteListing(id: string): Promise<void>;

  readMembers(filters?: Record<string, string>): Promise<Row[]>;
  insertMember(row: Row): Promise<Row>;
  updateMember(id: string, changes: Row): Promise<void>;
  deleteMember(id: string): Promise<void>;

  readJoinRequests(filters: Record<string, string>): Promise<Row[]>;
  insertJoinRequest(row: Row): Promise<Row>;
  updateJoinRequest(id: string, changes: Row): Promise<void>;
  deleteJoinRequest(id: string): Promise<void>;
}
