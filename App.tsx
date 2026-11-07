import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { Sora_400Regular, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from "@expo-google-fonts/sora";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { es, registerTranslation } from "react-native-paper-dates";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";

import { Container } from "./src/core/di/container";
import { DIProvider } from "./src/core/di/DIProvider";
import { createLocalContainer } from "./src/core/di/localContainer";
import { DialogProvider } from "./src/core/feedback/DialogProvider";
import { SnackbarProvider } from "./src/core/feedback/SnackbarProvider";
import { LocalTables } from "./src/core/data/LocalTables";
import { MissingConfigScreen } from "./src/core/roble/MissingConfigScreen";
import { missingRobleConfig, useLocalData } from "./src/core/roble/robleConfig";
import { SessionProvider, useSession } from "./src/features/auth/presentation/context/SessionContext";
import { NotificationCenterProvider } from "./src/features/notifications/presentation/context/NotificationCenter";
import { navigationRef } from "./src/navigation/navigationRef";
import RootNavigator from "./src/navigation/RootNavigator";
import { ThemePreferenceProvider, useThemePreference } from "./src/theme/ThemePreference";

// El selector de fechas del tablero, en español.
registerTranslation("es", es);

// El splash sigue arriba hasta que se recupera la sesión: la primera pantalla
// ya sabe si va el login o las pestañas.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Con `EXPO_PUBLIC_DATA_SOURCE=local` la app corre con datos en memoria: un
// contenedor por arranque, que hace de «servidor».
if (useLocalData) LocalTables.delay = 250;
const localContainer = useLocalData ? createLocalContainer() : undefined;

export default function App() {
  return <AppRoot container={localContainer} />;
}

// `container` deja que las pruebas cambien los datasources de Roble por falsos.
export function AppRoot({ container }: { container?: Container }) {
  const [fontsReady] = useFonts({
    ...MaterialCommunityIcons.font,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });
  if (!fontsReady) return null;
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics ?? fallbackMetrics}>
      <ThemePreferenceProvider>
        <Themed container={container} />
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}

// Donde no hay medidas iniciales (pruebas), se arranca con estas y se corrigen
// al medir.
const fallbackMetrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

function Themed({ container }: { container?: Container }) {
  const { theme, ready } = useThemePreference();
  const missing = container ? [] : missingRobleConfig();

  useEffect(() => {
    if (ready && missing.length > 0) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready, missing.length]);

  if (!ready) return null;

  if (missing.length > 0) {
    return (
      <PaperProvider theme={theme}>
        <MissingConfigScreen missing={missing} />
      </PaperProvider>
    );
  }

  const navigationTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.appBar,
      text: theme.colors.onAppBar,
      border: theme.colors.hairline,
      primary: theme.colors.primary,
      notification: theme.colors.error,
    },
  };

  return (
    <DIProvider container={container}>
      <PaperProvider theme={theme}>
        <StatusBar style={theme.dark ? "light" : "light"} />
        <SnackbarProvider>
          <DialogProvider>
            <SessionProvider>
              <NotificationCenterProvider>
                <NavigationContainer ref={navigationRef} theme={navigationTheme}>
                  <Shell />
                </NavigationContainer>
              </NotificationCenterProvider>
            </SessionProvider>
          </DialogProvider>
        </SnackbarProvider>
      </PaperProvider>
    </DIProvider>
  );
}

function Shell() {
  const { ready } = useSession();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);
  if (!ready) return null;
  return <RootNavigator />;
}
