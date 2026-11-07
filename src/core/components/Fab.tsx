import React from "react";
import { FAB } from "react-native-paper";

import { useAppTheme } from "@/src/theme/theme";
import { IconName } from "../ui/icons";

// `FloatingActionButton.extended` con el estilo de la app: carmesí, radio 18.
export function ExtendedFab({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID?: string }) {
  const theme = useAppTheme();
  return (
    <FAB
      testID={testID}
      icon={icon}
      label={label}
      onPress={onPress}
      color={theme.colors.onPrimary}
      style={{ position: "absolute", right: 16, bottom: 16, backgroundColor: theme.colors.primary, borderRadius: 18 }}
      customSize={56}
    />
  );
}
