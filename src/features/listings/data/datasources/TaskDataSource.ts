import { Row } from "@/src/core/roble/guard";

// El tablero de un proyecto (`listing_tasks`), en filas.
export interface TaskDataSource {
  readTasks(filters: Record<string, string>): Promise<Row[]>;
  insertTask(row: Row): Promise<Row>;
  updateTask(id: string, changes: Row): Promise<void>;
  deleteTask(id: string): Promise<void>;
}
