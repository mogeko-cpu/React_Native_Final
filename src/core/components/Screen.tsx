import React from "react";
import { ActivityIndicator, StyleProp, View, ViewStyle } from "react-native";

import { useAppTheme } from "@/src/theme/theme";
import { T } from "./T";

// El fondo de cada pantalla (`scaffoldBackgroundColor`).
export function Screen({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const theme = useAppTheme();
  return (
    <View testID={testID} style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}>
      {children}
    </View>
  );
}

export function Loading({ padded }: { padded?: boolean }) {
  const theme = useAppTheme();
  return (
    <View style={padded ? { paddingVertical: 40, alignItems: "center" } : { flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </View>
  );
}

// El título de una sección dentro de una lista.
export function SectionHeader({ title, trailing, size = "large" }: { title: string; trailing?: string; size?: "large" | "medium" }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <T v={size === "large" ? "titleLarge" : "titleMedium"} w={700}>
        {title}
      </T>
      {trailing != null && (
        <T v="labelLarge" color={theme.colors.onSurfaceVariant}>
          {trailing}
        </T>
      )}
    </View>
  );
}

export function Gap({ h = 0, w = 0 }: { h?: number; w?: number }) {
  return <View style={{ height: h, width: w }} />;
}
