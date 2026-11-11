import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { IconButton, Menu } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";

import { AppDialog } from "@/src/core/components/AppDialog";
import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { Icon } from "@/src/core/components/Icon";
import { Gap } from "@/src/core/components/Screen";
import { T } from "@/src/core/components/T";
import { dayOf, shortDay } from "@/src/core/utils/formatters";
import { useAppTheme } from "@/src/theme/theme";
import { ListingMember } from "../../domain/entities/Listing";
import { ListingTask } from "../../domain/entities/ListingTask";

export type TaskForm = { title: string; assigneeId: string; dueDate: string | null };

// Crear o editar una tarjeta del tablero (`_TaskFormDialog`): título,
// responsable y fecha límite.
export function TaskFormDialog({
  visible,
  people,
  initial,
  onCancel,
  onSave,
}: {
  visible: boolean;
  people: ListingMember[];
  initial: ListingTask | null;
  onCancel: () => void;
  onSave: (form: TaskForm) => void;
}) {
  const theme = useAppTheme();
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);

  useEffect(() => {
    if (!visible) return;
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(initial?.title ?? "");
    const id = initial?.assigneeId ?? "";
    setAssigneeId(people.some((p) => p.userId === id) ? id : "");
    setDueDate(initial?.dueDate ?? null);
    setTitleError(null);
  }, [visible, initial, people]);

  const save = () => {
    const clean = title.trim();
    if (clean.length < 3) {
      setTitleError("Escribe un título de al menos 3 caracteres");
      return;
    }
    onSave({ title: clean, assigneeId, dueDate });
  };

  const nameOf = (id: string) => {
    if (!id) return "Sin asignar";
    const person = people.find((p) => p.userId === id);
    return person?.userName || "Integrante";
  };

  const today = new Date();
  const toDate = (day: string) => {
    const [y, m, d] = day.split("-").map((n) => parseInt(n, 10));
    return new Date(y, m - 1, d);
  };

  return (
    <>
      <AppDialog
        visible={visible && !pickingDate}
        title={initial ? "Editar tarea" : "Nueva tarea"}
        onDismiss={onCancel}
        actions={
          <>
            <AppButton mode="text" onPress={onCancel}>
              Cancelar
            </AppButton>
            <AppButton testID="task-save" onPress={save}>
              Guardar
            </AppButton>
          </>
        }
      >
        <AppTextField testID="task-title" label="Título de la tarea" value={title} onChangeText={setTitle} autoFocus={!initial} error={titleError} />
        <Gap h={16} />
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={
            <Pressable
              testID="task-assignee"
              onPress={() => setMenuOpen(true)}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: theme.colors.raised,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
                  Responsable
                </T>
                <T v="bodyLarge">{nameOf(assigneeId)}</T>
              </View>
              <Icon name="menu-down" color={theme.colors.onSurfaceVariant} />
            </Pressable>
          }
          contentStyle={{ backgroundColor: theme.colors.raised, borderRadius: 14 }}
        >
          <Menu.Item
            title="Sin asignar"
            onPress={() => {
              setAssigneeId("");
              setMenuOpen(false);
            }}
          />
          {people.map((person) => (
            <Menu.Item
              key={person.userId}
              title={person.userName || "Integrante"}
              onPress={() => {
                setAssigneeId(person.userId);
                setMenuOpen(false);
              }}
            />
          ))}
        </Menu>
        <Gap h={16} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <T style={{ flex: 1 }}>{dueDate ? `Vence el ${shortDay(dueDate)}` : "Sin fecha límite"}</T>
          {dueDate != null && <IconButton hitSlop={6} accessibilityLabel="Quitar fecha" icon="close" onPress={() => setDueDate(null)} />}
          <AppButton mode="text" onPress={() => setPickingDate(true)}>
            Elegir fecha
          </AppButton>
        </View>
      </AppDialog>
      <DatePickerModal
        locale="es"
        mode="single"
        visible={pickingDate}
        date={dueDate ? toDate(dueDate) : today}
        validRange={{
          startDate: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
          endDate: new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()),
        }}
        onDismiss={() => setPickingDate(false)}
        onConfirm={({ date }) => {
          setPickingDate(false);
          if (date) setDueDate(dayOf(date));
        }}
        saveLabel="Aceptar"
        label="Fecha límite"
      />
    </>
  );
}
