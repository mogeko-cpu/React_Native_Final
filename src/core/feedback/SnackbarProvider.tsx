import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/src/theme/theme";
import { T } from "../components/T";

// En web no existe el módulo nativo de animación.
const NATIVE_DRIVER = Platform.OS !== "web";

export type SnackbarAction = { label: string; onPress: () => void };
type Options = { top?: boolean; error?: boolean; action?: SnackbarAction; duration?: number };
type Toast = { title: string; message?: string } & Options;
type Show = (title: string, message?: string, options?: Options) => void;

// Lo que dura un aviso; con un botón («Deshacer») se le da más tiempo.
export const SNACKBAR_MS = 3500;
export const UNDO_MS = 5000;

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
      setToast({ title, message, ...options, key: Date.now() });
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: NATIVE_DRIVER }).start();
      timer.current = setTimeout(hide, options?.duration ?? (options?.action ? UNDO_MS : SNACKBAR_MS));
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
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 14,
                paddingLeft: 16,
                paddingRight: toast.action ? 6 : 16,
                paddingVertical: 12,
                backgroundColor: toast.error ? theme.colors.errorContainer : theme.colors.inverseSurface,
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              <View style={{ flex: 1 }}>
                <T v="titleSmall" w={700} color={toast.error ? theme.colors.onErrorContainer : theme.colors.inverseOnSurface}>
                  {toast.title}
                </T>
                {!!toast.message && (
                  <T v="bodySmall" color={toast.error ? theme.colors.onErrorContainer : theme.colors.inverseOnSurface} style={{ marginTop: 2 }}>
                    {toast.message}
                  </T>
                )}
              </View>
              {toast.action && (
                <Pressable
                  testID="snackbar-action"
                  accessibilityRole="button"
                  accessibilityLabel={toast.action.label}
                  onPress={() => {
                    toast.action?.onPress();
                    if (timer.current) clearTimeout(timer.current);
                    hide();
                  }}
                  style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 12, justifyContent: "center", marginLeft: 8 }}
                >
                  <T v="labelLarge" w={800} color={theme.colors.inversePrimary}>
                    {toast.action.label}
                  </T>
                </Pressable>
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
