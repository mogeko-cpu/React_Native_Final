import React from "react";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";

import { alpha, useAppTheme } from "@/src/theme/theme";
import { IconName } from "../ui/icons";
import { Icon } from "./Icon";
import { T } from "./T";

// `ChoiceChip`/`FilterChip` de Material 3 con el radio de la app (10). Con
// `color` se pinta del color de la categoría, como hace Flutter.
export function ChoiceChip({
  label,
  selected,
  onPress,
  icon,
  iconColor,
  color,
  showCheck = true,
  style,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  iconColor?: string;
  color?: string;
  showCheck?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const theme = useAppTheme();
  const background = selected ? (color ?? theme.colors.secondaryContainer) : "transparent";
  const foreground = selected ? (color ? "#FFFFFF" : theme.colors.onSecondaryContainer) : theme.colors.onSurfaceVariant;
  const border = color ? alpha(color, selected ? 0 : 0.4) : selected ? "transparent" : theme.colors.outlineVariant;
  const leading = icon ?? (selected && showCheck && !color ? "check" : undefined);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          height: 32,
          paddingHorizontal: leading ? 8 : 14,
          paddingRight: 14,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: background,
        },
        style,
      ]}
    >
      {leading && (
        <Icon
          name={leading}
          size={16}
          color={selected && color ? "#FFFFFF" : (iconColor ?? (selected ? foreground : theme.colors.primary))}
          style={{ marginRight: 6 }}
        />
      )}
      <T v="labelLarge" w={selected && color ? 700 : 500} color={selected && !color ? theme.colors.onSecondaryContainer : selected ? "#FFFFFF" : theme.colors.onSurface}>
        {label}
      </T>
    </Pressable>
  );
}

// Un chip de solo lectura (`Chip` de Flutter): las habilidades.
export function TagChip({ label, compact, onDelete }: { label: string; compact?: boolean; onDelete?: () => void }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: compact ? 26 : 32,
        paddingHorizontal: compact ? 10 : 12,
        paddingRight: onDelete ? 6 : compact ? 10 : 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.hairline,
        backgroundColor: theme.colors.raised,
      }}
    >
      <T v={compact ? "labelMedium" : "labelLarge"}>{label}</T>
      {onDelete && (
        <Pressable accessibilityLabel={`Quitar ${label}`} onPress={onDelete} hitSlop={8} style={{ marginLeft: 6 }}>
          <Icon name="close-circle" size={18} color={theme.colors.onSurfaceVariant} />
        </Pressable>
      )}
    </View>
  );
}

// Una pastilla de color con ícono: categoría o estado de un proyecto.
export function Pill({ icon, label, color }: { icon: IconName; label: string; color: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: alpha(color, 0.14),
      }}
    >
      <Icon name={icon} size={13} color={color} />
      <T v="labelSmall" w={700} color={color} style={{ marginLeft: 5 }}>
        {label}
      </T>
    </View>
  );
}

export function Wrap({ children, gap = 8, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "row", flexWrap: "wrap", gap }, style]}>{children}</View>;
}
