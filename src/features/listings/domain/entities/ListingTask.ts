// Una tarjeta del tablero de un proyecto (`listing_task.dart`). Una tarea es una
// fila, nunca un arreglo dentro del proyecto: dos personas moviendo dos
// tarjetas a la vez no se pisan.

export type TaskColumn = "todo" | "doing" | "done" | "cancelled";
export const TASK_COLUMNS: TaskColumn[] = ["todo", "doing", "done", "cancelled"];
// Los pasos que se recorren con las flechas. Cancelado no es un paso: se llega
// desde el menú de la tarjeta.
export const TASK_FLOW: TaskColumn[] = ["todo", "doing", "done"];

const LABELS: Record<TaskColumn, string> = { todo: "Por hacer", doing: "En progreso", done: "Hecho", cancelled: "Cancelado" };
export const columnLabel = (column: TaskColumn) => LABELS[column];

export function previousColumn(column: TaskColumn): TaskColumn | null {
  const index = TASK_FLOW.indexOf(column);
  return index <= 0 ? null : TASK_FLOW[index - 1];
}

export function nextColumn(column: TaskColumn): TaskColumn | null {
  const index = TASK_FLOW.indexOf(column);
  return index === -1 || index === TASK_FLOW.length - 1 ? null : TASK_FLOW[index + 1];
}

export const columnFromName = (name: unknown): TaskColumn => (TASK_COLUMNS.includes(name as TaskColumn) ? (name as TaskColumn) : "todo");

export type ListingTask = {
  id: string;
  listingId: string;
  title: string;
  // Vacío: sin asignar.
  assigneeId: string;
  assigneeName: string;
  // `AAAA-MM-DD`, el día solo, a propósito: un timestamp arrastra la zona horaria.
  dueDate: string | null;
  column: TaskColumn;
  createdById: string;
  createdAt: Date;
};

export const isAssigned = (task: ListingTask) => task.assigneeId !== "";

// Vencida: con fecha antes de hoy y sin terminar ni cancelar.
export function isOverdue(task: ListingTask, today: string): boolean {
  if (!task.dueDate || task.column === "done" || task.column === "cancelled") return false;
  return task.dueDate < today;
}

// El avance cuenta las hechas sobre todas **menos las canceladas**: una tarea
// cancelada es trabajo que el equipo decidió no hacer.
export type TaskProgress = { done: number; total: number; cancelled: number };

export function progressOf(tasks: ListingTask[]): TaskProgress {
  return {
    done: tasks.filter((t) => t.column === "done").length,
    total: tasks.length,
    cancelled: tasks.filter((t) => t.column === "cancelled").length,
  };
}

export const countedOf = (p: TaskProgress) => p.total - p.cancelled;
export const fractionOf = (p: TaskProgress) => (countedOf(p) === 0 ? 0 : p.done / countedOf(p));
export const percentOf = (p: TaskProgress) => Math.round(fractionOf(p) * 100);
export const progressLabel = (p: TaskProgress) =>
  countedOf(p) === 1 ? `${p.done} de 1 tarea hecha` : `${p.done} de ${countedOf(p)} tareas hechas`;
