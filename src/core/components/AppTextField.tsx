import React from "react";
import { View } from "react-native";
import { HelperText, TextInput } from "react-native-paper";

import { fontOf, useAppTheme } from "@/src/theme/theme";
import { IconName } from "../ui/icons";

type Props = Omit<React.ComponentProps<typeof TextInput>, "error"> & {
  error?: string | null;
  helper?: string;
  leadingIcon?: IconName;
  maxLength?: number;
  showCounter?: boolean;
};

// Los campos de la app (`inputDecorationTheme`): rellenos del color de las
// tarjetas, con un borde suave que solo se vuelve carmesí al enfocar.
export function AppTextField({ error, helper, leadingIcon, style, multiline, numberOfLines, maxLength, showCounter, value, ...rest }: Props) {
  const theme = useAppTheme();
  const lines = numberOfLines ?? (multiline ? 4 : 1);
  return (
    <View>
      <TextInput
        mode="outlined"
        value={value}
        multiline={multiline}
        numberOfLines={lines}
        maxLength={maxLength}
        error={!!error}
        outlineStyle={{ borderRadius: 12 }}
        outlineColor={theme.colors.outlineVariant}
        activeOutlineColor={theme.colors.primary}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        left={leadingIcon ? <TextInput.Icon icon={leadingIcon} /> : undefined}
        contentStyle={[fontOf("bodyLarge"), multiline && { minHeight: 24 * Math.min(lines, 5), textAlignVertical: "top", paddingTop: 14 }]}
        style={[{ backgroundColor: theme.colors.raised }, style]}
        {...rest}
      />
      {(error || helper || showCounter) && (
        <View style={{ flexDirection: "row" }}>
          <HelperText type={error ? "error" : "info"} visible style={{ flex: 1 }}>
            {error || helper || ""}
          </HelperText>
          {showCounter && maxLength != null && (
            <HelperText type="info" visible>
              {`${String(value ?? "").length}/${maxLength}`}
            </HelperText>
          )}
        </View>
      )}
    </View>
  );
}
