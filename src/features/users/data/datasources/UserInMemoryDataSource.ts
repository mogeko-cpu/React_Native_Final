import { DummyData } from "@/src/core/data/dummyData";
import { Row } from "@/src/core/roble/guard";
import { Tables } from "@/src/core/roble/tables";
import { UserDataSource } from "./UserDataSource";

export class UserInMemoryDataSource implements UserDataSource {
  constructor(private readonly data: DummyData) {}

  async readUsers(filters?: Record<string, string>) {
    await this.data.tables.wait();
    return this.data.tables.read(Tables.appUsers, filters);
  }

  async insertUser(row: Row) {
    return this.data.tables.insert(Tables.appUsers, row);
  }

  async updateUser(id: string, changes: Row) {
    this.data.tables.update(Tables.appUsers, id, changes);
  }
}
