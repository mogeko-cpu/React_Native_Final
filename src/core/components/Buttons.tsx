import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Button, IconButton } from "react-native-paper";

import { useAppTheme } from "@/src/theme/theme";
import { IconName } from "../ui/icons";

type Mode = "filled" | "tonal" | "outlined" | "text";

const PAPER_MODE = { filled: "contained", tonal: "contained-tonal", outlined: "outlined", text: "text" } as const;

// Los botones de Material 3 con el radio de la app (12). `big` es el de 52 de
// alto y ancho completo que Flutter usa para la acción principal.
export function AppButton({
  mode = "filled",
  icon,
  onPress,
  disabled,
  loading,
  big,
  tall,
  style,
  textColor,
  children,
  testID,
  accessibilityLabel,
  accessibilityState,
}: {
  mode?: Mode;
  icon?: IconName;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  big?: boolean;
  tall?: boolean;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
  children: React.ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean };
}) {
  const theme = useAppTheme();
  // 44 como mínimo: el objetivo táctil que piden las pautas de accesibilidad.
  const height = big ? 52 : tall ? 48 : 44;
  return (
    <Button
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      mode={PAPER_MODE[mode]}
      icon={loading ? undefined : icon}
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      textColor={textColor}
      style={[{ borderRadius: 12 }, mode === "outlined" && { borderColor: theme.colors.outlineVariant }, style]}
      contentStyle={{ height }}
      labelStyle={{ fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20, marginVertical: 0 }}
    >
      {children}
    </Button>
  );
}

// `IconButton.filled` de Flutter.
export function FilledIconButton({ icon, onPress, disabled, testID, accessibilityLabel }: { icon: IconName; onPress?: () => void; disabled?: boolean; testID?: string; accessibilityLabel?: string }) {
  const theme = useAppTheme();
  return (
    <IconButton
      hitSlop={6}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      icon={icon}
      mode="contained"
      containerColor={theme.colors.primary}
      iconColor={theme.colors.onPrimary}
      onPress={onPress}
      disabled={disabled}
      size={22}
      style={{ margin: 0 }}
    />
  );
}
