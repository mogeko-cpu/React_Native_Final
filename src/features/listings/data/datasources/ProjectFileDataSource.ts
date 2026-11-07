import { Row } from "@/src/core/roble/guard";

// Las fichas de lo que el equipo compartió (`project_files`). Los bytes no
// viven aquí: están en el bucket (`FileStorageDataSource`).
export interface ProjectFileDataSource {
  readFiles(filters: Record<string, string>): Promise<Row[]>;
  insertFile(row: Row): Promise<Row>;
  deleteFile(id: string): Promise<void>;
}
