import { Row } from "@/src/core/roble/guard";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { Tables } from "@/src/core/roble/tables";
import { UserDataSource } from "./UserDataSource";

export class UserRemoteDataSource implements UserDataSource {
  constructor(private readonly client: RobleClient) {}

  readUsers(filters?: Record<string, string>) {
    return this.client.read(Tables.appUsers, filters);
  }

  insertUser(row: Row) {
    return this.client.insert(Tables.appUsers, row);
  }

  updateUser(id: string, changes: Row) {
    return this.client.update(Tables.appUsers, id, changes);
  }
}
