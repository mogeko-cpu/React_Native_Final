import { TableOps } from "@/src/core/data/tableOps";
import { Row } from "@/src/core/roble/guard";
import { ListingDataSource } from "./ListingDataSource";

// La implementación común: el remoto y el de memoria solo cambian de dónde
// salen las tablas.
export abstract class ListingTablesDataSource implements ListingDataSource {
  protected abstract listings: TableOps;
  protected abstract members: TableOps;
  protected abstract requests: TableOps;

  readListings(filters?: Record<string, string>) {
    return this.listings.read(filters);
  }
  insertListing(row: Row) {
    return this.listings.insert(row);
  }
  updateListing(id: string, changes: Row) {
    return this.listings.update(id, changes);
  }
  deleteListing(id: string) {
    return this.listings.remove(id);
  }
  readMembers(filters?: Record<string, string>) {
    return this.members.read(filters);
  }
  insertMember(row: Row) {
    return this.members.insert(row);
  }
  updateMember(id: string, changes: Row) {
    return this.members.update(id, changes);
  }
  deleteMember(id: string) {
    return this.members.remove(id);
  }
  readJoinRequests(filters: Record<string, string>) {
    return this.requests.read(filters);
  }
  insertJoinRequest(row: Row) {
    return this.requests.insert(row);
  }
  updateJoinRequest(id: string, changes: Row) {
    return this.requests.update(id, changes);
  }
  deleteJoinRequest(id: string) {
    return this.requests.remove(id);
  }
}
