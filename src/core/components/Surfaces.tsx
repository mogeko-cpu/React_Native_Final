import React from "react";
import { Platform, Pressable, StyleProp, View, ViewStyle } from "react-native";

import { alpha, AppTheme, useAppTheme } from "@/src/theme/theme";
import { IconName } from "../ui/icons";
import { Icon } from "./Icon";
import { T } from "./T";

// Lo que da profundidad a las pantallas (`_withLayers` en `app_theme.dart`):
// un fondo teñido y, una capa encima, todo lo que tiene contenido —tarjetas,
// paneles—, más claro, con un borde fino y una sombra suave.
export function raisedStyle(theme: AppTheme, radius = 20): ViewStyle {
  return {
    backgroundColor: theme.colors.raised,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    shadowColor: theme.dark ? "#000" : "#1F2A44",
    shadowOpacity: theme.dark ? 0.28 : 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  };
}

// Un `Card` de Material con el estilo de la app. Con `onPress` se puede tocar.
export function Card({
  children,
  onPress,
  style,
  color,
  radius = 18,
  testID,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  color?: string;
  radius?: number;
  testID?: string;
}) {
  const theme = useAppTheme();
  const base = [raisedStyle(theme, radius), { shadowColor: theme.colors.cardShadow, shadowOpacity: theme.dark ? 0.5 : 0.35, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, color ? { backgroundColor: color } : null, { marginBottom: 14 }, style];
  if (!onPress) {
    return (
      <View testID={testID} style={base}>
        {children}
      </View>
    );
  }
  return (
    <View style={base}>
      <Pressable
        testID={testID}
        onPress={onPress}
        android_ripple={{ color: alpha(theme.colors.onSurface, 0.08) }}
        style={({ pressed }) => [{ borderRadius: radius, overflow: "hidden" }, pressed && Platform.OS !== "android" && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    </View>
  );
}

// Un panel con título opcional e ícono en un cuadrito teñido (`panel.dart`).
export function Panel({
  title,
  icon,
  accent,
  trailing,
  children,
  padding = 18,
  style,
}: {
  title?: string;
  icon?: IconName;
  accent?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const tint = accent ?? theme.colors.primary;
  return (
    <View style={[raisedStyle(theme), { padding }, style]}>
      {title != null && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          {icon && (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: alpha(tint, 0.12),
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Icon name={icon} size={18} color={tint} />
            </View>
          )}
          <T v="titleSmall" w={700} style={{ flex: 1 }}>
            {title}
          </T>
          {trailing}
        </View>
      )}
      {children}
    </View>
  );
}

// Un aviso de una línea con ícono (`info_banner.dart`).
export function InfoBanner({ icon, text, tint }: { icon: IconName; text: string; tint?: string }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
      }}
    >
      <Icon name={icon} color={tint ?? theme.colors.primary} />
      <T style={{ flex: 1, marginLeft: 12 }}>{text}</T>
    </View>
  );
}
