import React from "react";
import { Text, TextProps } from "react-native";

import { fontOf, TypeVariant, useAppTheme, Weight } from "@/src/theme/theme";

type Props = TextProps & {
  v?: TypeVariant;
  w?: Weight;
  color?: string;
  center?: boolean;
};

// El texto de la app con la escala de Material 3 y las fuentes del tema
// (Sora para títulos, Inter para lo demás). `w` elige el peso: en Android cada
// peso es su propia familia, así que no se puede usar `fontWeight`.
export function T({ v = "bodyMedium", w, color, center, style, ...rest }: Props) {
  const theme = useAppTheme();
  return (
    <Text
      {...rest}
      style={[fontOf(v, w), { color: color ?? theme.colors.onSurface }, center && { textAlign: "center" }, style]}
    />
  );
}
