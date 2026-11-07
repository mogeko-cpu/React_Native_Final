import React from "react";
import { View } from "react-native";

import { useAppTheme } from "@/src/theme/theme";
import { IconName } from "../ui/icons";
import { Hero, onHero } from "./Hero";
import { Icon } from "./Icon";
import { T } from "./T";

// El encabezado con degradado de Grupos y Ranking (`gradient_header.dart`):
// ícono, título, subtítulo y, si hay, unas cifras.
export function GradientHeader({
  icon,
  title,
  subtitle,
  stats = [],
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  stats?: [string, string][];
}) {
  const theme = useAppTheme();
  return (
    <Hero radius={20} padding={20}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: onHero(theme, 0.18),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} color={theme.colors.onPrimary} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <T v="titleLarge" w={700} color={theme.colors.onPrimary}>
            {title}
          </T>
          <T v="bodySmall" color={onHero(theme, 0.85)} style={{ marginTop: 2 }}>
            {subtitle}
          </T>
        </View>
      </View>
      {stats.length > 0 && (
        <View style={{ flexDirection: "row", marginTop: 16, gap: 10 }}>
          {stats.map(([value, label]) => (
            <View key={label} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: onHero(theme, 0.14) }}>
              <T v="titleMedium" w={700} color={theme.colors.onPrimary}>
                {value}
              </T>
              <T v="labelSmall" color={onHero(theme, 0.85)}>
                {label}
              </T>
            </View>
          ))}
        </View>
      )}
    </Hero>
  );
}
