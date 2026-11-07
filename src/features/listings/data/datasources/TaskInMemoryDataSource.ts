import { localTable, TableOps } from "@/src/core/data/tableOps";
import { DummyData } from "@/src/core/data/dummyData";
import { Tables } from "@/src/core/roble/tables";
import { TaskTablesDataSource } from "./TaskTablesDataSource";

export class TaskInMemoryDataSource extends TaskTablesDataSource {
  protected tasks: TableOps;

  constructor(data: DummyData) {
    super();
    this.tasks = localTable(data, Tables.listingTasks);
  }
}
