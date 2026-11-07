import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { AppTheme, darkTheme, lightTheme } from "./theme";

export type ThemeMode = "light" | "dark" | "system";

const KEY = "theme_mode";

type ThemePreference = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: AppTheme;
  ready: boolean;
};

const ThemePreferenceContext = createContext<ThemePreference | null>(null);

// El tema que la persona eligió la última vez (`theme_controller.dart`): claro,
// oscuro o el del sistema. Se lee antes del primer cuadro, para no parpadear.
export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark") setModeState(stored);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(KEY, next).catch(() => undefined);
  }, []);

  const isDark = mode === "dark" || (mode === "system" && system === "dark");
  const value = useMemo(() => ({ mode, setMode, theme: (isDark ? darkTheme : lightTheme) as AppTheme, ready }), [mode, setMode, isDark, ready]);

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error("ThemePreferenceProvider missing");
  return ctx;
}
