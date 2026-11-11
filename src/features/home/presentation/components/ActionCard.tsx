import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, View } from "react-native";

import { heroShadow } from "@/src/core/components/Hero";
import { HeroDecor } from "@/src/core/components/HeroDecor";
import { Icon } from "@/src/core/components/Icon";
import { T } from "@/src/core/components/T";
import { IconName } from "@/src/core/ui/icons";
import { alpha, mix, useAppTheme } from "@/src/theme/theme";

// La tarjeta de acción de Inicio (`action_card.dart`): «Publicar idea».
export function ActionCard({ icon, title, subtitle, onPress, testID }: { icon: IconName; title: string; subtitle: string; onPress: () => void; testID?: string }) {
  const theme = useAppTheme();
  const foreground = theme.colors.onPrimary;
  return (
    <View style={[{ borderRadius: 18 }, heroShadow(theme)]}>
      <Pressable testID={testID} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${subtitle}`} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        <LinearGradient
          colors={[theme.colors.primary, mix(theme.colors.primary, "#000000", 0.22)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 18, padding: 18, overflow: "hidden" }}
        >
          <HeroDecor color={foreground} />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: alpha(foreground, 0.16), alignItems: "center", justifyContent: "center" }}>
              <Icon name={icon} size={26} color={foreground} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <T v="titleMedium" w={700} color={foreground}>
                {title}
              </T>
              <T v="bodySmall" color={alpha(foreground, 0.8)} style={{ marginTop: 2 }}>
                {subtitle}
              </T>
            </View>
            <Icon name="arrow-right" color={alpha(foreground, 0.85)} />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
