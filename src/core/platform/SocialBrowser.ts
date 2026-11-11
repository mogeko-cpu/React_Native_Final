import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { appUrl } from "./appUrl";

export type SocialReturn = { code?: string; error?: string; errorDescription?: string };

// A dónde se va la app para entrar con Google y cómo vuelve
// (`social/social_browser*.dart`).
//
// - **Web**: la pestaña se va a Google y vuelve a la dirección de la app con
//   `?code=`, que se lee al arrancar (`readReturn`).
// - **Teléfono**: se abre una sesión de navegador dentro de la app y Google
//   vuelve al enlace propio (`campusinnovate://auth`). Ese enlace tiene que
//   estar registrado en la consola de Roble como destino (por omisión con el
//   nombre `mobile`); si no lo está, Roble rechaza el inicio y la pantalla lo
//   dice en vez de abrir un navegador que no tiene a dónde volver.
export const SocialBrowser = {
  get isWeb() {
    return Platform.OS === "web" && typeof window !== "undefined";
  },

  // El enlace al que vuelve Google en el teléfono. En Expo Go es `exp://…`; en
  // una compilación propia, `campusinnovate://auth`.
  get nativeReturnUrl() {
    return appUrl("auth");
  },

  goTo(url: string) {
    window.location.assign(url);
  },

  // Teléfono: abre Google y espera a que vuelva. `null` si la persona cerró
  // el navegador sin terminar.
  async openAuthSession(url: string): Promise<SocialReturn | null> {
    const result = await WebBrowser.openAuthSessionAsync(url, this.nativeReturnUrl);
    if (result.type !== "success") return null;
    return parseReturn(result.url);
  },

  // El `?code=` o `?error=` con que Roble devuelve a la app web.
  readReturn(): SocialReturn {
    if (!this.isWeb) return {};
    return parseReturn(window.location.href);
  },

  // El código es de un solo uso: se borra de la dirección **antes** de
  // gastarlo, o un F5 convertiría un inicio exitoso en un error.
  dropQuery() {
    if (!this.isWeb) return;
    window.history.replaceState(null, "", window.location.pathname);
  },
};

export function parseReturn(url: string): SocialReturn {
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1).split("#")[0] : "";
  const params = new URLSearchParams(query);
  return {
    code: params.get("code") ?? undefined,
    error: params.get("error") ?? undefined,
    errorDescription: params.get("error_description") ?? undefined,
  };
}
