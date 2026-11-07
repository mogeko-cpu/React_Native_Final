import { TableOps } from "@/src/core/data/tableOps";
import { Row } from "@/src/core/roble/guard";
import { TaskDataSource } from "./TaskDataSource";

export abstract class TaskTablesDataSource implements TaskDataSource {
  protected abstract tasks: TableOps;

  readTasks(filters: Record<string, string>) {
    return this.tasks.read(filters);
  }
  insertTask(row: Row) {
    return this.tasks.insert(row);
  }
  updateTask(id: string, changes: Row) {
    return this.tasks.update(id, changes);
  }
  deleteTask(id: string) {
    return this.tasks.remove(id);
  }
}
