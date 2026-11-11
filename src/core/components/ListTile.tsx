import React from "react";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";

import { alpha, useAppTheme } from "@/src/theme/theme";
import { T } from "./T";

// `ListTile` de Flutter: inicio, título, subtítulo y algo al final.
export function ListTile({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  dense,
  selected,
  padded = true,
  titleLines = 1,
  subtitleLines = 2,
  style,
  testID,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  dense?: boolean;
  selected?: boolean;
  padded?: boolean;
  titleLines?: number;
  subtitleLines?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const theme = useAppTheme();
  const body = (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: dense ? 6 : 10,
          paddingHorizontal: padded ? 16 : 0,
          minHeight: dense ? 48 : 56,
          backgroundColor: selected ? alpha(theme.colors.primary, 0.08) : undefined,
          borderRadius: selected ? 12 : 0,
        },
        style,
      ]}
    >
      {leading && <View style={{ marginRight: 16 }}>{leading}</View>}
      <View style={{ flex: 1 }}>
        {typeof title === "string" ? (
          <T v={dense ? "bodyMedium" : "bodyLarge"} numberOfLines={titleLines} color={selected ? theme.colors.primary : undefined}>
            {title}
          </T>
        ) : (
          title
        )}
        {subtitle != null &&
          (typeof subtitle === "string" ? (
            <T v={dense ? "bodySmall" : "bodyMedium"} numberOfLines={subtitleLines} color={theme.colors.onSurfaceVariant}>
              {subtitle}
            </T>
          ) : (
            subtitle
          ))}
      </View>
      {trailing && <View style={{ marginLeft: 12 }}>{trailing}</View>}
    </View>
  );
  if (!onPress) return <View testID={testID}>{body}</View>;
  return (
    <Pressable testID={testID} onPress={onPress} accessibilityRole="button" android_ripple={{ color: alpha(theme.colors.onSurface, 0.08) }}>
      {body}
    </Pressable>
  );
}
