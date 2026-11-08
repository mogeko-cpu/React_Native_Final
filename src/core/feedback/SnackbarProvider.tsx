import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/src/theme/theme";
import { T } from "../components/T";

// En web no existe el módulo nativo de animación.
const NATIVE_DRIVER = Platform.OS !== "web";

type Toast = { title: string; message?: string; top?: boolean; error?: boolean };
type Show = (title: string, message?: string, options?: { top?: boolean; error?: boolean }) => void;

const SnackbarContext = createContext<Show | null>(null);

// El aviso de un título y un mensaje que Flutter mostraba con `Get.snackbar`,
// uno para toda la app. Los view models no pintan nada: la pantalla llama a
// `useSnackbar()` con lo que pasó. Abajo por defecto; las notificaciones
// nuevas salen arriba, como en la versión Flutter.
export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(Toast & { key: number }) | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: NATIVE_DRIVER }).start(() => setToast(null));
  }, [opacity]);

  const show = useCallback<Show>(
    (title, message, options) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ title, message, top: options?.top, error: options?.error, key: Date.now() });
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: NATIVE_DRIVER }).start();
      timer.current = setTimeout(hide, 3500);
    },
    [hide, opacity],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {toast && (
        <View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFill, { justifyContent: toast.top ? "flex-start" : "flex-end", paddingTop: insets.top + 8, paddingBottom: insets.bottom + 90 }]}
        >
          <Animated.View style={{ opacity, marginHorizontal: 12 }}>
            <Pressable
              testID="snackbar"
              onPress={hide}
              style={{
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: toast.error ? theme.colors.errorContainer : theme.colors.inverseSurface,
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              <T v="titleSmall" w={700} color={toast.error ? theme.colors.onErrorContainer : theme.colors.inverseOnSurface}>
                {toast.title}
              </T>
              {!!toast.message && (
                <T v="bodySmall" color={toast.error ? theme.colors.onErrorContainer : theme.colors.inverseOnSurface} style={{ marginTop: 2 }}>
                  {toast.message}
                </T>
              )}
            </Pressable>
          </Animated.View>
        </View>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): Show {
  // Fuera del provider (una pieza suelta en una prueba) no hay barra: se ignora.
  return useContext(SnackbarContext) ?? noop;
}

const noop: Show = () => {};
