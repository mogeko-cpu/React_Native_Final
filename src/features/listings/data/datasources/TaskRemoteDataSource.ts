import { remoteTable, TableOps } from "@/src/core/data/tableOps";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { Tables } from "@/src/core/roble/tables";
import { TaskTablesDataSource } from "./TaskTablesDataSource";

export class TaskRemoteDataSource extends TaskTablesDataSource {
  protected tasks: TableOps;

  constructor(client: RobleClient) {
    super();
    this.tasks = remoteTable(client, Tables.listingTasks);
  }
}
