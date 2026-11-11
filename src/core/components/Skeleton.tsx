import React, { createContext, useContext, useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, StyleProp, View, ViewStyle } from "react-native";

import { useAppTheme } from "@/src/theme/theme";
import { raisedStyle } from "./Surfaces";

// En web no existe el módulo nativo de animación.
const NATIVE_DRIVER = Platform.OS !== "web";

// Esqueletos de carga: la forma de lo que viene, en vez de un círculo girando.
// Un solo pulso para todos los bloques de la pantalla, y quieto si el sistema
// pide reducir el movimiento.
const Pulse = createContext<Animated.Value | number>(1);

function usePulse() {
  const [value] = useState(() => new Animated.Value(0.55));
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((on) => active && setReduceMotion(on))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(value, { toValue: 0.55, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value, reduceMotion]);
  return reduceMotion ? 0.8 : value;
}

// Un bloque gris con la forma de un texto, un avatar o un botón.
export function Bone({ width = "100%", height = 14, radius = 8, style }: { width?: number | `${number}%`; height?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useAppTheme();
  const opacity = useContext(Pulse);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: theme.colors.surfaceVariant, opacity }, style]} />;
}

type Variant = "cards" | "tiles" | "detail" | "chat";

// La pantalla (o la sección) mientras carga. `padded` para usarlo dentro de
// una lista que ya tiene su margen.
export function Skeleton({ variant = "cards", count = 3, padded }: { variant?: Variant; count?: number; padded?: boolean }) {
  const pulse = usePulse();
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <Pulse.Provider value={pulse}>
      <View
        testID="skeleton"
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Cargando"
        accessibilityState={{ busy: true }}
        style={padded ? undefined : { flex: 1, padding: variant === "detail" ? 16 : 20 }}
      >
        {variant === "cards" && items.map((i) => <CardBones key={i} />)}
        {variant === "tiles" && items.map((i) => <TileBones key={i} />)}
        {variant === "chat" && items.map((i) => <BubbleBones key={i} mine={i % 2 === 1} />)}
        {variant === "detail" && <DetailBones />}
      </View>
    </Pulse.Provider>
  );
}

function CardBones() {
  const theme = useAppTheme();
  return (
    <View style={[raisedStyle(theme, 18), { padding: 18, marginBottom: 14 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Bone width={96} height={22} radius={11} />
        <Bone width={70} height={22} radius={11} />
      </View>
      <Bone width="75%" height={20} style={{ marginTop: 16 }} />
      <Bone height={12} style={{ marginTop: 12 }} />
      <Bone width="85%" height={12} style={{ marginTop: 8 }} />
      <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
        <Bone width={64} height={24} />
        <Bone width={80} height={24} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
        <Bone width={28} height={28} radius={14} />
        <Bone width={120} height={12} style={{ marginLeft: 10 }} />
      </View>
    </View>
  );
}

function TileBones() {
  const theme = useAppTheme();
  return (
    <View style={[raisedStyle(theme, 18), { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 10 }]}>
      <Bone width={44} height={44} radius={12} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Bone width="60%" height={14} />
        <Bone width="40%" height={11} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

function BubbleBones({ mine }: { mine: boolean }) {
  return (
    <View style={{ alignItems: mine ? "flex-end" : "flex-start", marginBottom: 12 }}>
      <Bone width={mine ? "55%" : "65%"} height={44} radius={16} />
    </View>
  );
}

function DetailBones() {
  const theme = useAppTheme();
  return (
    <View>
      <Bone height={150} radius={22} />
      <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
        <Bone width={70} height={40} radius={12} />
        <Bone width={70} height={40} radius={12} />
        <Bone width={90} height={16} style={{ alignSelf: "center" }} />
      </View>
      {[0, 1].map((i) => (
        <View key={i} style={[raisedStyle(theme, 18), { padding: 18, marginTop: 18 }]}>
          <Bone width="40%" height={16} />
          <Bone height={12} style={{ marginTop: 14 }} />
          <Bone width="90%" height={12} style={{ marginTop: 8 }} />
          <Bone width="70%" height={12} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}
