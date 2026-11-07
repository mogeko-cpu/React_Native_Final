import { AppTheme, fontFamilies } from "@/src/theme/theme";

// La barra de arriba (`appBarTheme`): carmesí con letra blanca en claro, del
// color del fondo en oscuro, sin sombra. Título en Sora.
export function headerOptions(theme: AppTheme) {
  return {
    headerStyle: { backgroundColor: theme.colors.appBar },
    headerTintColor: theme.colors.onAppBar,
    headerShadowVisible: false,
    headerTitleAlign: "left" as const,
    headerTitleStyle: { fontFamily: fontFamilies.display[700], fontSize: 20, color: theme.colors.onAppBar },
    headerBackButtonDisplayMode: "minimal" as const,
    contentStyle: { backgroundColor: theme.colors.background },
  };
}
