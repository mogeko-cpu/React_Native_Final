import { configureFonts, MD3DarkTheme, MD3LightTheme, useTheme } from "react-native-paper";

// La identidad visual de Campus Innovate (`app_theme.dart`): carmesí académico
// como voz principal, azul marino para la estructura y un dorado apagado para
// los acentos. Sora para lo que se lee como título, Inter para lo que se lee.
export const brand = {
  crimson: "#9E1B32",
  navy: "#1F2A44",
  gold: "#B08D3F",
  // El fondo de cada pantalla clara: un susurro del azul, para que las
  // tarjetas blancas se lean como una capa encima y no como la misma hoja.
  paper: "#F3F1F5",
  green: "#1E9E6B",
  blue: "#2F6FED",
  orange: "#E07A1E",
  purple: "#7A4FE0",
  teal: "#1B8B9E",
  grey: "#7B8794",
};

// Las familias que se cargan en `App.tsx`. En Android una fuente propia no se
// puede «poner en negrita»: cada peso es su propia familia.
export const fontFamilies = {
  display: { 400: "Sora_400Regular", 500: "Sora_600SemiBold", 600: "Sora_600SemiBold", 700: "Sora_700Bold", 800: "Sora_800ExtraBold" },
  body: { 400: "Inter_400Regular", 500: "Inter_500Medium", 600: "Inter_600SemiBold", 700: "Inter_700Bold", 800: "Inter_800ExtraBold" },
} as const;

export type Weight = 400 | 500 | 600 | 700 | 800;

// La escala de Material 3. `display` dice si va en Sora.
export const typeScale = {
  displaySmall: { fontSize: 36, lineHeight: 44, weight: 400, display: true },
  headlineMedium: { fontSize: 28, lineHeight: 36, weight: 400, display: true },
  headlineSmall: { fontSize: 24, lineHeight: 32, weight: 400, display: true },
  titleLarge: { fontSize: 22, lineHeight: 28, weight: 400, display: true },
  titleMedium: { fontSize: 16, lineHeight: 24, weight: 500, display: true },
  titleSmall: { fontSize: 14, lineHeight: 20, weight: 500, display: false },
  bodyLarge: { fontSize: 16, lineHeight: 24, weight: 400, display: false },
  bodyMedium: { fontSize: 14, lineHeight: 20, weight: 400, display: false },
  bodySmall: { fontSize: 12, lineHeight: 16, weight: 400, display: false },
  labelLarge: { fontSize: 14, lineHeight: 20, weight: 500, display: false },
  labelMedium: { fontSize: 12, lineHeight: 16, weight: 500, display: false },
  labelSmall: { fontSize: 11, lineHeight: 16, weight: 500, display: false },
} as const;

export type TypeVariant = keyof typeof typeScale;

export function fontOf(variant: TypeVariant, weight?: Weight) {
  const spec = typeScale[variant];
  const family = spec.display ? fontFamilies.display : fontFamilies.body;
  return { fontFamily: family[weight ?? (spec.weight as Weight)], fontSize: spec.fontSize, lineHeight: spec.lineHeight };
}

// Paper dibuja sus botones, campos y chips con estas fuentes.
const paperFonts = configureFonts({
  config: Object.fromEntries(
    Object.entries(typeScale).map(([variant, spec]) => [
      variant,
      {
        fontFamily: (spec.display ? fontFamilies.display : fontFamilies.body)[spec.weight as Weight],
        fontSize: spec.fontSize,
        lineHeight: spec.lineHeight,
        fontWeight: "normal" as const,
        letterSpacing: 0,
      },
    ]),
  ) as any,
});

const light = {
  primary: brand.crimson,
  onPrimary: "#FFFFFF",
  primaryContainer: "#F7DDE1",
  onPrimaryContainer: "#5A0C18",
  secondary: brand.navy,
  onSecondary: "#FFFFFF",
  secondaryContainer: "#DDE2EC",
  onSecondaryContainer: "#141E34",
  tertiary: brand.gold,
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#F6EAD2",
  onTertiaryContainer: "#61481E",
  error: "#B3261E",
  onError: "#FFFFFF",
  errorContainer: "#F9DEDC",
  onErrorContainer: "#410E0B",
  background: brand.paper,
  onBackground: "#1D1B20",
  surface: "#FFFFFF",
  onSurface: "#1D1B20",
  surfaceVariant: "#EEEAF0",
  onSurfaceVariant: "#49454F",
  outline: "#79747E",
  outlineVariant: "#CAC4D0",
  shadow: "#000000",
  scrim: "#000000",
  inverseSurface: "#322F35",
  inverseOnSurface: "#F5EFF7",
  inversePrimary: "#E8909E",
  elevation: {
    level0: "transparent",
    level1: "#FFFFFF",
    level2: "#FFFFFF",
    level3: "#FFFFFF",
    level4: "#FFFFFF",
    level5: "#FFFFFF",
  },
  surfaceDisabled: "rgba(29, 27, 32, 0.12)",
  onSurfaceDisabled: "rgba(29, 27, 32, 0.38)",
  backdrop: "rgba(31, 42, 68, 0.4)",
};

const dark = {
  primary: "#E8909E",
  onPrimary: "#4A0A16",
  primaryContainer: "#7A1426",
  onPrimaryContainer: "#FFD9DE",
  secondary: "#AFBDD8",
  onSecondary: "#18233A",
  secondaryContainer: "#2C3A58",
  onSecondaryContainer: "#DCE3F4",
  tertiary: "#D9BC7C",
  onTertiary: "#3D2E0B",
  tertiaryContainer: "#6B5524",
  onTertiaryContainer: "#F8E4BA",
  error: "#F2B8B5",
  onError: "#601410",
  errorContainer: "#8C1D18",
  onErrorContainer: "#F9DEDC",
  background: "#16151A",
  onBackground: "#E7E1E7",
  surface: "#211F25",
  onSurface: "#E7E1E7",
  surfaceVariant: "#2E2B33",
  onSurfaceVariant: "#CAC4D0",
  outline: "#938F99",
  outlineVariant: "#49454F",
  shadow: "#000000",
  scrim: "#000000",
  inverseSurface: "#E7E1E7",
  inverseOnSurface: "#322F35",
  inversePrimary: brand.crimson,
  elevation: {
    level0: "transparent",
    level1: "#221F26",
    level2: "#26232B",
    level3: "#2A2730",
    level4: "#2C2932",
    level5: "#2F2C36",
  },
  surfaceDisabled: "rgba(231, 225, 231, 0.12)",
  onSurfaceDisabled: "rgba(231, 225, 231, 0.38)",
  backdrop: "rgba(0, 0, 0, 0.5)",
};

// Lo que Material 3 tiene y Paper no: las capas de superficie, el borde fino
// de tarjetas y paneles, y la sombra teñida de azul en vez de gris.
const lightExtra = {
  raised: "#FFFFFF",
  surfaceContainerLow: "#F7F4F8",
  surfaceContainerHigh: "#ECE7EE",
  surfaceContainerHighest: "#E6E0E8",
  hairline: "rgba(202, 196, 208, 0.55)",
  cardShadow: "rgba(31, 42, 68, 0.16)",
  appBar: brand.crimson,
  onAppBar: "#FFFFFF",
};

const darkExtra = {
  raised: "#211F25",
  surfaceContainerLow: "#1C1A20",
  surfaceContainerHigh: "#2B2830",
  surfaceContainerHighest: "#36333B",
  hairline: "rgba(73, 69, 79, 0.35)",
  cardShadow: "rgba(0, 0, 0, 0.55)",
  appBar: "#16151A",
  onAppBar: "#E7E1E7",
};

export const lightTheme = {
  ...MD3LightTheme,
  dark: false,
  roundness: 3,
  fonts: paperFonts,
  colors: { ...MD3LightTheme.colors, ...light, ...lightExtra },
};

export const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 3,
  fonts: paperFonts,
  colors: { ...MD3DarkTheme.colors, ...dark, ...darkExtra },
};

export type AppTheme = typeof lightTheme;
export const useAppTheme = () => useTheme<AppTheme>();

// Un color con transparencia: `alpha("#9E1B32", 0.12)`.
export function alpha(hex: string, opacity: number): string {
  if (!hex.startsWith("#")) return hex;
  const value = hex.slice(1);
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}

// Mezcla dos colores: `mix("#9E1B32", "#000000", 0.22)` es el carmesí un 22 % más oscuro.
export function mix(a: string, b: string, amount: number): string {
  const parse = (hex: string) => {
    const n = parseInt(hex.slice(1, 7), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * amount).toString(16).padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}
