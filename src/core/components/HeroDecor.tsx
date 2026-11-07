import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

import { alpha } from "@/src/theme/theme";

// Los círculos suaves detrás de los encabezados con degradado
// (`hero_decor.dart`): dos rellenos y un aro, medidos sobre el lado corto.
export function HeroDecor({ color }: { color: string }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const big = Math.min(size.width, size.height) * 0.95;
  const circle = (cx: number, cy: number, r: number, filled: boolean) => ({
    position: "absolute" as const,
    left: cx - r,
    top: cy - r,
    width: r * 2,
    height: r * 2,
    borderRadius: r,
    ...(filled ? { backgroundColor: alpha(color, 0.07) } : { borderWidth: 1.2, borderColor: alpha(color, 0.1) }),
  });
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {big > 0 && (
        <>
          <View style={circle(size.width - big * 0.18, -big * 0.12, big * 0.62, true)} />
          <View style={circle(size.width - big * 0.05, size.height + big * 0.05, big * 0.42, true)} />
          <View style={circle(size.width - big * 0.28, size.height * 0.2, big * 0.36, false)} />
        </>
      )}
    </View>
  );
}
