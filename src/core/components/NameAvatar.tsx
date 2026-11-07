import React from "react";
import { View } from "react-native";

import { alpha } from "@/src/theme/theme";
import { avatarColorOf } from "../ui/avatarColor";
import { initialsOf } from "../utils/formatters";
import { T } from "./T";

// Un círculo con las iniciales, del color que le toca al nombre
// (`name_avatar.dart`).
export function NameAvatar({ name, radius = 15 }: { name: string; radius?: number }) {
  const color = avatarColorOf(name);
  return (
    <View
      style={{
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        backgroundColor: alpha(color, 0.16),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <T v="labelMedium" w={700} color={color} style={{ fontSize: radius * 0.62, lineHeight: radius * 0.62 * 1.25 }}>
        {initialsOf(name)}
      </T>
    </View>
  );
}

// Un círculo con un ícono sobre `primaryContainer` (`CircleAvatar` de Flutter).
export function IconAvatar({ children, radius = 20, color }: { children: React.ReactNode; radius?: number; color: string }) {
  return (
    <View
      style={{
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}
