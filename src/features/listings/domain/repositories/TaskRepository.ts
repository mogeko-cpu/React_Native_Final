import { ListingTask, TaskColumn, TaskProgress } from "../entities/ListingTask";

export interface TaskRepository {
  // Por columna, luego lo que vence primero, y al final lo más viejo.
  getTasks(listingId: string): Promise<ListingTask[]>;
  progressOf(listingId: string): Promise<TaskProgress>;
  createTask(draft: Omit<ListingTask, "id" | "column" | "createdAt">): Promise<ListingTask>;
  updateTask(task: ListingTask): Promise<ListingTask>;
  moveTask(task: ListingTask, column: TaskColumn): Promise<ListingTask>;
  deleteTask(taskId: string): Promise<void>;
  // Quien sale del equipo deja sus tareas sin asignar. Devuelve cuántas.
  unassignAll(p: { listingId: string; userId: string }): Promise<number>;
  purgeListing(listingId: string): Promise<void>;
}

export const MIN_TASK_TITLE = 3;
export const MAX_TASK_TITLE = 120;
