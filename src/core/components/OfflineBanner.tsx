import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/src/theme/theme";
import { useIsOffline } from "../network/useConnectivity";
import { Icon } from "./Icon";
import { T } from "./T";

// La franja de arriba sin conexión: se ve lo último guardado y los cambios
// esperan a que vuelva el internet.
export function OfflineBanner() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const offline = useIsOffline();
  if (!offline) return null;
  return (
    <View
      testID="offline-banner"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingTop: insets.top + 8,
        paddingBottom: 8,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.inverseSurface,
      }}
    >
      <Icon name="wifi-off" size={18} color={theme.colors.inverseOnSurface} />
      <T v="labelMedium" w={600} color={theme.colors.inverseOnSurface} style={{ marginLeft: 10, flex: 1 }}>
        Sin conexión. Ves lo último guardado; los cambios se podrán hacer al volver el internet.
      </T>
    </View>
  );
}
