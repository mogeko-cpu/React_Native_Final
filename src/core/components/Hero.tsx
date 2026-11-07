import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { alpha, AppTheme, useAppTheme } from "@/src/theme/theme";
import { HeroDecor } from "./HeroDecor";

// La sombra de los bloques con degradado, teñida del carmesí (`heroShadow`).
export function heroShadow(theme: AppTheme): ViewStyle {
  return {
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  };
}

// Un bloque con el degradado carmesí → azul marino y los círculos decorativos:
// el saludo de Inicio, la identidad del Perfil, los encabezados de Grupos y
// Ranking y el avance del tablero.
export function Hero({
  children,
  radius = 20,
  padding = 20,
  colors,
  style,
  decor = true,
}: {
  children?: React.ReactNode;
  radius?: number;
  padding?: number;
  colors?: [string, string];
  style?: StyleProp<ViewStyle>;
  decor?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View style={[{ borderRadius: radius }, heroShadow(theme), style]}>
      <LinearGradient
        colors={colors ?? [theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fill, { borderRadius: radius }]}
      >
        {decor && <HeroDecor color={theme.colors.onPrimary} />}
        <View style={{ padding }}>{children}</View>
      </LinearGradient>
    </View>
  );
}

export const onHero = (theme: AppTheme, opacity = 1) => alpha(theme.colors.onPrimary, opacity);

const styles = StyleSheet.create({
  fill: { overflow: "hidden" },
});
