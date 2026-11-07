import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { IconButton, Menu } from "react-native-paper";

import { LinearProgress } from "@/src/core/components/LinearProgress";

import { EmptyState } from "@/src/core/components/EmptyState";
import { ExtendedFab } from "@/src/core/components/Fab";
import { Hero, onHero } from "@/src/core/components/Hero";
import { Icon } from "@/src/core/components/Icon";
import { NameAvatar } from "@/src/core/components/NameAvatar";
import { Loading, Screen } from "@/src/core/components/Screen";
import { Card, InfoBanner } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { useConfirm } from "@/src/core/feedback/DialogProvider";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { IconName } from "@/src/core/ui/icons";
import { shortDay, todayDay } from "@/src/core/utils/formatters";
import { RootStackParamList } from "@/src/navigation/types";
import { brand, useAppTheme } from "@/src/theme/theme";
import {
  columnLabel,
  fractionOf,
  isAssigned,
  isOverdue,
  ListingTask,
  nextColumn,
  percentOf,
  previousColumn,
  progressLabel,
  TASK_COLUMNS,
  TaskColumn,
  TaskProgress,
} from "../../domain/entities/ListingTask";
import { TaskForm, TaskFormDialog } from "../components/TaskFormDialog";
import { useTasksViewModel } from "../viewmodels/useTasksViewModel";

const COLUMN_ICON: Record<TaskColumn, IconName> = {
  todo: "radiobox-blank",
  doing: "timelapse",
  done: "check-circle-outline",
  cancelled: "cancel",
};

// El tablero de un proyecto (`tasks_page.dart`). En el teléfono, una pestaña por
// columna: Por hacer, En progreso, Hecho y Cancelado.
export default function TasksScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { listingId } = useRoute<RouteProp<RootStackParamList, "Tasks">>().params;
  const vm = useTasksViewModel(listingId);
  const confirm = useConfirm();
  const snackbar = useSnackbar();
  const [tab, setTab] = useState<TaskColumn>("todo");
  const [form, setForm] = useState<{ initial: ListingTask | null } | null>(null);

  useLayoutEffect(() => {
    const title = vm.listing?.title;
    navigation.setOptions({ title: title ? `Tareas · ${title}` : "Tareas" });
  }, [navigation, vm.listing?.title]);

  const failed = (title: string) => snackbar(title, vm.lastActionError() ?? "Intenta de nuevo");

  const save = async (values: TaskForm) => {
    const initial = form?.initial ?? null;
    setForm(null);
    if (initial) {
      if (!(await vm.edit(initial, values))) failed("No se pudo guardar");
    } else if (!(await vm.create(values))) failed("No se pudo crear");
  };

  const move = async (task: ListingTask, column: TaskColumn) => {
    if (!(await vm.move(task, column))) failed("No se pudo mover");
  };

  const cancel = async (task: ListingTask) => {
    const ok = await confirm({
      title: "¿Cancelar la tarea?",
      message: `"${task.title}" queda en la columna Cancelado y deja de contar para el avance. Puedes reabrirla cuando quieras.`,
      confirmLabel: "Cancelar tarea",
    });
    if (ok && !(await vm.cancel(task))) failed("No se pudo cancelar");
  };

  const reopen = async (task: ListingTask) => {
    if (!(await vm.reopen(task))) failed("No se pudo reabrir");
  };

  const remove = async (task: ListingTask) => {
    const ok = await confirm({ title: "¿Eliminar la tarea?", message: `"${task.title}" desaparece del tablero.`, confirmLabel: "Eliminar" });
    if (ok && !(await vm.remove(task))) failed("No se pudo eliminar");
  };

  if (vm.isLoading) return <Screen><Loading /></Screen>;
  if (vm.error || !vm.listing) {
    return (
      <Screen>
        <EmptyState icon="lock-outline" title="No se pudo abrir el tablero" message={vm.error ?? "Proyecto no encontrado"} />
      </Screen>
    );
  }

  const today = todayDay();
  const counts = Object.fromEntries(TASK_COLUMNS.map((c) => [c, vm.tasksIn(c).length])) as Record<TaskColumn, number>;
  const cards = vm.tasksIn(tab);

  return (
    <Screen>
      <ProgressHeader progress={vm.progress} counts={counts} />
      {!vm.canWork && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <InfoBanner icon="eye-outline" text="Como mentor puedes seguir el tablero, pero no mover las tarjetas." />
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline }}>
        {TASK_COLUMNS.map((column) => {
          const selected = column === tab;
          return (
            <Pressable key={column} testID={`tab-${column}`} onPress={() => setTab(column)} style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <T v="titleSmall" w={selected ? 700 : 500} color={selected ? theme.colors.primary : theme.colors.onSurfaceVariant}>
                {`${columnLabel(column)} (${counts[column]})`}
              </T>
              <View style={{ height: 3, marginTop: 10, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: selected ? theme.colors.primary : "transparent" }} />
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 96 }}>
        {cards.length === 0 ? (
          <EmptyState inline icon="inbox-outline" title={`Nada en "${columnLabel(tab)}"`} />
        ) : (
          cards.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canWork={vm.canWork}
              canDelete={vm.canDelete(task)}
              isBusy={vm.busyTaskId === task.id}
              isLocked={vm.busyTaskId != null}
              isOverdue={isOverdue(task, today)}
              onMove={(column) => move(task, column)}
              onEdit={() => setForm({ initial: task })}
              onCancel={() => cancel(task)}
              onReopen={() => reopen(task)}
              onDelete={() => remove(task)}
            />
          ))
        )}
      </ScrollView>
      {vm.canWork && <ExtendedFab testID="fab-new-task" icon="checkbox-marked-circle-plus-outline" label="Nueva tarea" onPress={() => setForm({ initial: null })} />}
      <TaskFormDialog visible={form != null} people={vm.assignable} initial={form?.initial ?? null} onCancel={() => setForm(null)} onSave={save} />
    </Screen>
  );
}

function ProgressHeader({ progress, counts }: { progress: TaskProgress; counts: Record<TaskColumn, number> }) {
  const theme = useAppTheme();
  const on = theme.colors.onPrimary;
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
      <Hero radius={20} padding={0}>
        <View style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <T v="headlineMedium" w={800} color={on} style={{ lineHeight: 30 }}>
              {`${percentOf(progress)}%`}
            </T>
            <T v="titleSmall" w={600} color={onHero(theme, 0.9)} style={{ flex: 1, marginLeft: 12 }}>
              {progressLabel(progress)}
            </T>
          </View>
          <LinearProgress progress={fractionOf(progress)} color={on} track={onHero(theme, 0.22)} style={{ marginTop: 12 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {TASK_COLUMNS.map((column) => (
              <View key={column} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: onHero(theme, 0.14) }}>
                <Icon name={COLUMN_ICON[column]} size={13} color={onHero(theme, 0.9)} />
                <T v="labelMedium" w={700} color={on} style={{ marginLeft: 5 }}>
                  {counts[column]}
                </T>
              </View>
            ))}
          </View>
        </View>
      </Hero>
    </View>
  );
}

function accentOf(column: TaskColumn, outline: string) {
  switch (column) {
    case "todo":
      return brand.orange;
    case "doing":
      return brand.blue;
    case "done":
      return brand.green;
    default:
      return outline;
  }
}

function TaskCard({
  task,
  canWork,
  canDelete,
  isBusy,
  isLocked,
  isOverdue,
  onMove,
  onEdit,
  onCancel,
  onReopen,
  onDelete,
}: {
  task: ListingTask;
  canWork: boolean;
  canDelete: boolean;
  isBusy: boolean;
  isLocked: boolean;
  isOverdue: boolean;
  onMove: (column: TaskColumn) => void;
  onEdit: () => void;
  onCancel: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  const theme = useAppTheme();
  const [menu, setMenu] = useState(false);
  const previous = previousColumn(task.column);
  const next = nextColumn(task.column);
  const struck = task.column === "done" || task.column === "cancelled";
  const pick = (action: () => void) => () => {
    setMenu(false);
    action();
  };
  return (
    <Card testID={`task-${task.id}`} style={{ marginBottom: 10, overflow: "hidden" }}>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: 4, backgroundColor: accentOf(task.column, theme.colors.outline), borderTopLeftRadius: 18, borderBottomLeftRadius: 18 }} />
        <View style={{ flex: 1, paddingLeft: 14, paddingRight: 6, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <T
              v="titleSmall"
              w={700}
              color={task.column === "cancelled" ? theme.colors.onSurfaceVariant : undefined}
              style={[{ flex: 1, paddingTop: 4 }, struck && { textDecorationLine: "line-through" }]}
            >
              {task.title}
            </T>
            {canWork && (
              <Menu
                visible={menu}
                onDismiss={() => setMenu(false)}
                contentStyle={{ backgroundColor: theme.colors.raised, borderRadius: 14 }}
                anchor={<IconButton testID={`task-menu-${task.id}`} accessibilityLabel="Opciones de la tarea" icon="dots-vertical" size={20} style={{ margin: 0 }} disabled={isLocked} onPress={() => setMenu(true)} />}
              >
                <Menu.Item title="Editar" onPress={pick(onEdit)} />
                {task.column === "cancelled" ? <Menu.Item title="Reabrir tarea" onPress={pick(onReopen)} /> : <Menu.Item title="Cancelar tarea" onPress={pick(onCancel)} />}
                {canDelete && <Menu.Item title="Eliminar" onPress={pick(onDelete)} />}
              </Menu>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
            {isAssigned(task) ? (
              <>
                <NameAvatar name={task.assigneeName} radius={11} />
                <T v="bodySmall" numberOfLines={1} style={{ marginLeft: 6, flexShrink: 1 }}>
                  {task.assigneeName || "Integrante"}
                </T>
              </>
            ) : (
              <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
                Sin asignar
              </T>
            )}
            {task.dueDate != null && (
              <>
                <Icon name="calendar-outline" size={14} color={isOverdue ? theme.colors.error : theme.colors.outline} style={{ marginLeft: 10 }} />
                <T v="bodySmall" w={isOverdue ? 700 : 400} color={isOverdue ? theme.colors.error : undefined} numberOfLines={1} style={{ marginLeft: 3, flexShrink: 1 }}>
                  {isOverdue ? `Venció el ${shortDay(task.dueDate)}` : `Vence el ${shortDay(task.dueDate)}`}
                </T>
              </>
            )}
          </View>
          {canWork && (
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 4, minHeight: 40 }}>
              {isBusy ? (
                <View style={{ padding: 12 }}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : (
                <>
                  {previous && (
                    <IconButton testID={`task-back-${task.id}`} accessibilityLabel={`Mover a ${columnLabel(previous)}`} icon="arrow-left" disabled={isLocked} onPress={() => onMove(previous)} />
                  )}
                  {next && <IconButton testID={`task-next-${task.id}`} accessibilityLabel={`Mover a ${columnLabel(next)}`} icon="arrow-right" disabled={isLocked} onPress={() => onMove(next)} />}
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}
