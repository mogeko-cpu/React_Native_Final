import { localTable, TableOps } from "@/src/core/data/tableOps";
import { DummyData } from "@/src/core/data/dummyData";
import { Tables } from "@/src/core/roble/tables";
import { ProjectFileTablesDataSource } from "./ProjectFileTablesDataSource";

export class ProjectFileInMemoryDataSource extends ProjectFileTablesDataSource {
  protected files: TableOps;

  constructor(data: DummyData) {
    super();
    this.files = localTable(data, Tables.projectFiles);
  }
}
