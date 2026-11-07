import { guardRoble, isRowId, parseDate, Row, str } from "@/src/core/roble/guard";
import { columnFromName, ListingTask, progressOf, TASK_COLUMNS, TaskColumn, TaskProgress } from "../../domain/entities/ListingTask";
import { ListingFailure } from "../../domain/ListingFailure";
import { MAX_TASK_TITLE, MIN_TASK_TITLE, TaskRepository } from "../../domain/repositories/TaskRepository";
import { TaskDataSource } from "../datasources/TaskDataSource";

const failure = (message: string) => new ListingFailure(message);

// El tablero (`roble_task_source.dart` + `task_repository.dart`).
export class TaskRepositoryImpl implements TaskRepository {
  constructor(private readonly source: TaskDataSource) {}

  private q<T>(action: () => Promise<T>): Promise<T> {
    return guardRoble(action, failure);
  }

  private async readTasks(listingId: string): Promise<ListingTask[]> {
    if (!isRowId(listingId)) return [];
    const rows = await this.q(() => this.source.readTasks({ listing_id: listingId }));
    return rows.map(toTask).filter((t): t is ListingTask => t != null);
  }

  // ROBLE no ordena: por columna, luego lo que vence primero —una tarea sin
  // fecha después de las que tienen— y al final lo más viejo.
  async getTasks(listingId: string): Promise<ListingTask[]> {
    return (await this.readTasks(listingId)).sort((a, b) => {
      const byColumn = TASK_COLUMNS.indexOf(a.column) - TASK_COLUMNS.indexOf(b.column);
      if (byColumn !== 0) return byColumn;
      if (a.dueDate && b.dueDate) {
        if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      } else if (a.dueDate || b.dueDate) {
        return a.dueDate ? -1 : 1;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  async progressOf(listingId: string): Promise<TaskProgress> {
    return progressOf(await this.readTasks(listingId));
  }

  async createTask(draft: Omit<ListingTask, "id" | "column" | "createdAt">): Promise<ListingTask> {
    const task: ListingTask = { ...draft, id: "", title: validTitle(draft.title), column: "todo", createdAt: new Date() };
    const row = await this.q(() =>
      this.source.insertTask({
        listing_id: task.listingId,
        ...editableColumns(task),
        created_by: task.createdById,
        created_at: task.createdAt.toISOString(),
      }),
    );
    const id = str(row._id);
    if (!id) throw failure("ROBLE guardó la tarea pero no devolvió su identificador. Recarga el tablero antes de volver a crearla.");
    return { ...task, id };
  }

  async updateTask(task: ListingTask): Promise<ListingTask> {
    const clean = { ...task, title: validTitle(task.title) };
    await this.q(() => this.source.updateTask(task.id, editableColumns(clean)));
    return clean;
  }

  async moveTask(task: ListingTask, column: TaskColumn): Promise<ListingTask> {
    if (task.column === column) return task;
    const moved = { ...task, column };
    await this.q(() => this.source.updateTask(task.id, editableColumns(moved)));
    return moved;
  }

  deleteTask(taskId: string) {
    return this.q(() => this.source.deleteTask(taskId));
  }

  async unassignAll({ listingId, userId }: { listingId: string; userId: string }): Promise<number> {
    let freed = 0;
    for (const task of await this.readTasks(listingId)) {
      if (task.assigneeId !== userId) continue;
      await this.q(() => this.source.updateTask(task.id, editableColumns({ ...task, assigneeId: "", assigneeName: "" })));
      freed++;
    }
    return freed;
  }

  async purgeListing(listingId: string) {
    if (!isRowId(listingId)) return;
    for (const row of await this.q(() => this.source.readTasks({ listing_id: listingId }))) {
      await this.q(() => this.source.deleteTask(str(row._id)));
    }
  }
}

function validTitle(title: string): string {
  const clean = title.trim().replace(/\s+/g, " ");
  if (clean.length < MIN_TASK_TITLE) throw failure(`Escribe un título de al menos ${MIN_TASK_TITLE} caracteres.`);
  if (clean.length > MAX_TASK_TITLE) throw failure(`El título es muy largo. Máximo ${MAX_TASK_TITLE} caracteres.`);
  return clean;
}

function editableColumns(task: ListingTask): Row {
  return {
    title: task.title,
    assignee_id: task.assigneeId,
    assignee_name: task.assigneeName,
    due_date: task.dueDate,
    status: task.column,
  };
}

function toTask(row: Row): ListingTask | null {
  const id = str(row._id);
  const listingId = str(row.listing_id);
  if (!id || !listingId) return null;
  const due = str(row.due_date);
  return {
    id,
    listingId,
    title: str(row.title),
    assigneeId: str(row.assignee_id),
    assigneeName: str(row.assignee_name),
    dueDate: due.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(due) ? due.substring(0, 10) : null,
    column: columnFromName(row.status),
    createdById: str(row.created_by),
    createdAt: parseDate(row.created_at),
  };
}
