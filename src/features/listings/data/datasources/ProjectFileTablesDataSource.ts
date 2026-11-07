import { TableOps } from "@/src/core/data/tableOps";
import { Row } from "@/src/core/roble/guard";
import { ProjectFileDataSource } from "./ProjectFileDataSource";

export abstract class ProjectFileTablesDataSource implements ProjectFileDataSource {
  protected abstract files: TableOps;

  readFiles(filters: Record<string, string>) {
    return this.files.read(filters);
  }
  insertFile(row: Row) {
    return this.files.insert(row);
  }
  deleteFile(id: string) {
    return this.files.remove(id);
  }
}
