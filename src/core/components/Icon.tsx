import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { StyleProp, TextStyle } from "react-native";

import { useAppTheme } from "@/src/theme/theme";
import { IconName } from "../ui/icons";

export function Icon({ name, size = 24, color, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const theme = useAppTheme();
  return <MaterialCommunityIcons name={name} size={size} color={color ?? theme.colors.onSurface} style={style} />;
}
