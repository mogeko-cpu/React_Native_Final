import React from "react";
import { ScrollView, View } from "react-native";
import { Dialog, Portal } from "react-native-paper";

import { useAppTheme } from "@/src/theme/theme";
import { T } from "./T";

// Un `AlertDialog` de Material 3 con el estilo de la app: radio 24 y el color
// de las tarjetas. `actions` va abajo a la derecha.
export function AppDialog({
  visible,
  title,
  onDismiss,
  children,
  actions,
  scroll,
}: {
  visible: boolean;
  title: string;
  onDismiss: () => void;
  children: React.ReactNode;
  actions: React.ReactNode;
  scroll?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ borderRadius: 24, backgroundColor: theme.colors.raised, maxHeight: "90%" }}>
        <Dialog.Title>
          <T v="headlineSmall">{title}</T>
        </Dialog.Title>
        {scroll ? (
          <Dialog.ScrollArea style={{ paddingHorizontal: 24, borderColor: "transparent" }}>
            <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
          </Dialog.ScrollArea>
        ) : (
          <Dialog.Content>{children}</Dialog.Content>
        )}
        <Dialog.Actions>
          <View style={{ flexDirection: "row", gap: 8 }}>{actions}</View>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
