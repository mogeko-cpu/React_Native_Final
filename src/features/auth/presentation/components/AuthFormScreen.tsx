import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { Icon } from "@/src/core/components/Icon";
import { Gap, Screen } from "@/src/core/components/Screen";
import { T } from "@/src/core/components/T";
import { DummyData } from "@/src/core/data/dummyData";
import { useLocalData } from "@/src/core/roble/robleConfig";
import { IconName } from "@/src/core/ui/icons";
import { alpha, useAppTheme } from "@/src/theme/theme";

// El marco de las pantallas de cuenta que no son el login: un ícono, un título,
// una explicación corta y el formulario.
export function AuthFormScreen({ icon, title, subtitle, children }: { icon: IconName; title: string; subtitle: string; children: React.ReactNode }) {
  const theme = useAppTheme();
  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <View
            style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: alpha(theme.colors.primary, 0.12), alignItems: "center", justifyContent: "center" }}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <Icon name={icon} size={28} color={theme.colors.primary} />
          </View>
          <Gap h={16} />
          <T v="titleLarge" w={700} accessibilityRole="header">
            {title}
          </T>
          <Gap h={6} />
          <T v="bodyMedium" color={theme.colors.onSurfaceVariant}>
            {subtitle}
          </T>
          <Gap h={24} />
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// En la app sin servidor no llega ningún correo: se dice cuál es el código.
export function DemoCodeHint() {
  const theme = useAppTheme();
  if (!useLocalData) return null;
  return (
    <T v="bodySmall" color={theme.colors.onSurfaceVariant} style={{ marginTop: 10 }}>
      Modo sin servidor: el código es {DummyData.demoCode}
    </T>
  );
}
