import { remoteTable, TableOps } from "@/src/core/data/tableOps";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { Tables } from "@/src/core/roble/tables";
import { ProjectFileTablesDataSource } from "./ProjectFileTablesDataSource";

export class ProjectFileRemoteDataSource extends ProjectFileTablesDataSource {
  protected files: TableOps;

  constructor(client: RobleClient) {
    super();
    this.files = remoteTable(client, Tables.projectFiles);
  }
}
