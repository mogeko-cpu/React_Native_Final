import React from "react";
import { View } from "react-native";

import { alpha, useAppTheme } from "@/src/theme/theme";
import { IconName } from "../ui/icons";
import { AppButton } from "./Buttons";
import { Icon } from "./Icon";
import { T } from "./T";

type Props = {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tint?: string;
  // `inline` va dentro de una lista; si no, ocupa la pantalla.
  inline?: boolean;
};

// Lo que se ve cuando no hay nada que mostrar (`empty_state.dart`).
export function EmptyState({ icon, title, message, actionLabel, onAction, tint, inline }: Props) {
  const theme = useAppTheme();
  const accent = tint ?? theme.colors.primary;
  const circle = inline ? 52 : 76;
  const content = (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: alpha(accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={inline ? 26 : 36} color={accent} />
      </View>
      <T v={inline ? "titleSmall" : "titleMedium"} w={700} center style={{ marginTop: inline ? 12 : 18 }}>
        {title}
      </T>
      {message != null && (
        <T v="bodySmall" center color={theme.colors.onSurfaceVariant} style={{ marginTop: 6 }}>
          {message}
        </T>
      )}
      {actionLabel != null && onAction && (
        <AppButton mode="tonal" icon="plus" onPress={onAction} style={{ marginTop: inline ? 14 : 20 }}>
          {actionLabel}
        </AppButton>
      )}
    </View>
  );
  if (inline) {
    return (
      <View
        style={{
          paddingVertical: 26,
          paddingHorizontal: 20,
          borderRadius: 16,
          backgroundColor: theme.colors.surfaceContainerLow,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
        }}
      >
        {content}
      </View>
    );
  }
  return <View style={{ flex: 1, justifyContent: "center", padding: 40 }}>{content}</View>;
}
