import { Platform } from "react-native";

// A dónde se va la app para entrar con Google y cómo vuelve
// (`social/social_browser*.dart`). El único destino de regreso registrado en la
// consola de Roble es la versión web, así que en el teléfono no hay a dónde
// volver: allí el botón responde con un mensaje, sin gastar una petición.
export const SocialBrowser = {
  get isSupported() {
    return Platform.OS === "web" && typeof window !== "undefined";
  },

  goTo(url: string) {
    window.location.assign(url);
  },

  // El `?code=` o `?error=` con que Roble devuelve a la app.
  readReturn(): { code?: string; error?: string; errorDescription?: string } {
    if (!this.isSupported) return {};
    const query = new URLSearchParams(window.location.search);
    return {
      code: query.get("code") ?? undefined,
      error: query.get("error") ?? undefined,
      errorDescription: query.get("error_description") ?? undefined,
    };
  },

  // El código es de un solo uso: se borra de la dirección **antes** de
  // gastarlo, o un F5 convertiría un inicio exitoso en un error.
  dropQuery() {
    if (!this.isSupported) return;
    window.history.replaceState(null, "", window.location.pathname);
  },
};
