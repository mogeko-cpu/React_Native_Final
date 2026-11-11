import * as Linking from "expo-linking";

// El enlace propio de la app para `path`: `exp://…/--/path` en Expo Go y
// `campusinnovate://path` en una compilación propia. Si Expo no puede decirlo
// (pruebas, sin manifiesto), se usa el esquema de `app.json`.
export function appUrl(path: string): string {
  try {
    return Linking.createURL(path);
  } catch {
    return `campusinnovate://${path.replace(/^\/+/, "")}`;
  }
}
