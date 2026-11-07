import { useCallback, useEffect, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { canWorkTasks, Listing, ListingMember, roleOf, teamOf } from "../../domain/entities/Listing";
import { isAssigned, ListingTask, progressOf, TaskColumn } from "../../domain/entities/ListingTask";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { TaskRepository } from "../../domain/repositories/TaskRepository";

// El tablero de un proyecto (`tasks_view_model.dart`). Lo ve el equipo entero;
// el mentor lo sigue sin mover tarjetas.
export function useTasksViewModel(listingId: string) {
  const tasksRepo = useInject<TaskRepository>(TOKENS.TaskRepo);
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const notifier = useInject<NotificationPublisher>(TOKENS.NotificationPublisher);
  const user = useCurrentUser();

  const [listing, setListing] = useState<Listing | null>(null);
  const [tasks, setTasks] = useState<ListingTask[]>([]);
  const [isLoading, setLoading] = useState(true);
  // La tarjeta que se está escribiendo; `""` es «una nueva». Una a la vez.
  const [busyTaskId, setBusy] = useState<string | null>(null);
  const busy = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastActionError = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await listings.getListingById(listingId);
      if (!found) {
        setError("Proyecto no encontrado");
        return;
      }
      if (roleOf(found, user.id) == null) {
        setError("Solo el equipo del proyecto puede ver sus tareas.");
        return;
      }
      setListing(found);
      setTasks(await tasksRepo.getTasks(listingId));
    } catch (e) {
      setError(messageOf(e, "No se pudieron cargar las tareas"));
    } finally {
      setLoading(false);
    }
  }, [listings, tasksRepo, listingId, user.id]);

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const myRole = listing ? roleOf(listing, user.id) : null;
  const canWork = canWorkTasks(myRole);
  const canDelete = (task: ListingTask) => myRole === "leader" || (canWork && task.createdById === user.id);
  // A quién se le puede asignar: a quien trabaja, no al mentor.
  const assignable: ListingMember[] = listing ? teamOf(listing).filter((m) => canWorkTasks(m.role)) : [];
  const tasksIn = (column: TaskColumn) => tasks.filter((t) => t.column === column);
  const memberOf = (userId: string) => (userId ? (assignable.find((m) => m.userId === userId) ?? null) : null);

  const run = async (action: () => Promise<void>, fallback: string, taskId = ""): Promise<boolean> => {
    if (busy.current != null) return false;
    busy.current = taskId;
    setBusy(taskId);
    lastActionError.current = null;
    try {
      await action();
      return true;
    } catch (e) {
      lastActionError.current = messageOf(e, fallback);
      return false;
    } finally {
      busy.current = null;
      setBusy(null);
    }
  };

  const reload = async () => setTasks(await tasksRepo.getTasks(listingId));

  // Se avisa solo si la tarea cambió de responsable.
  const notifyAssignee = async (task: ListingTask, previousAssigneeId: string) => {
    if (!listing || !isAssigned(task) || task.assigneeId === previousAssigneeId) return;
    await notifier.taskAssigned({
      listingId: listing.id,
      listingTitle: listing.title,
      taskTitle: task.title,
      assignerId: user.id,
      assignerName: user.name,
      assigneeId: task.assigneeId,
    });
  };

  const create = (form: { title: string; assigneeId: string; dueDate: string | null }) => {
    if (!listing || !canWork) return Promise.resolve(false);
    return run(async () => {
      const assignee = memberOf(form.assigneeId);
      const stored = await tasksRepo.createTask({
        listingId,
        title: form.title,
        createdById: user.id,
        assigneeId: assignee?.userId ?? "",
        assigneeName: assignee?.userName ?? "",
        dueDate: form.dueDate,
      });
      await notifyAssignee(stored, "");
      await reload();
    }, "No se pudo crear la tarea");
  };

  const edit = (task: ListingTask, form: { title: string; assigneeId: string; dueDate: string | null }) => {
    if (!canWork) return Promise.resolve(false);
    return run(
      async () => {
        const assignee = memberOf(form.assigneeId);
        const saved = await tasksRepo.updateTask({
          ...task,
          title: form.title,
          assigneeId: assignee?.userId ?? "",
          assigneeName: assignee?.userName ?? "",
          dueDate: form.dueDate,
        });
        await notifyAssignee(saved, task.assigneeId);
        await reload();
      },
      "No se pudo guardar la tarea",
      task.id,
    );
  };

  const move = (task: ListingTask, column: TaskColumn) => {
    if (!canWork) return Promise.resolve(false);
    return run(
      async () => {
        await tasksRepo.moveTask(task, column);
        await reload();
      },
      "No se pudo mover la tarea",
      task.id,
    );
  };

  const remove = (task: ListingTask) => {
    if (!canDelete(task)) return Promise.resolve(false);
    return run(
      async () => {
        await tasksRepo.deleteTask(task.id);
        await reload();
      },
      "No se pudo eliminar la tarea",
      task.id,
    );
  };

  return {
    currentUserId: user.id,
    listing,
    tasks,
    isLoading,
    busyTaskId,
    error,
    lastActionError: () => lastActionError.current,
    load,
    canWork,
    canDelete,
    assignable,
    tasksIn,
    progress: progressOf(tasks),
    create,
    edit,
    move,
    cancel: (task: ListingTask) => move(task, "cancelled"),
    reopen: (task: ListingTask) => move(task, "todo"),
    remove,
  };
}
