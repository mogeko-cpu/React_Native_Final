import { Platform, Share } from "react-native";

import { appUrl } from "./appUrl";

// `manual`: el navegador no dejó compartir ni copiar; la pantalla muestra el
// enlace para copiarlo a mano.
export type ShareResult = "shared" | "copied" | "dismissed" | "manual";

// Compartir un enlace con lo que tenga el teléfono (WhatsApp, correo…). En el
// navegador se usa el menú de compartir del sistema si existe y, si no, se
// copia el enlace.
export interface Sharer {
  share(p: { title: string; message: string; url: string }): Promise<ShareResult>;
}

export class SystemSharer implements Sharer {
  async share({ title, message, url }: { title: string; message: string; url: string }): Promise<ShareResult> {
    if (Platform.OS === "web") {
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      if (nav?.share) {
        try {
          await nav.share({ title, text: message, url });
          return "shared";
        } catch (e) {
          if ((e as { name?: string })?.name === "AbortError") return "dismissed";
        }
      }
      try {
        if (!nav?.clipboard) return "manual";
        await nav.clipboard.writeText(`${message}\n${url}`);
        return "copied";
      } catch {
        return "manual";
      }
    }
    // Android solo lee `message`; iOS muestra `url` aparte.
    const result = await Share.share(Platform.OS === "ios" ? { title, message, url } : { title, message: `${message}\n${url}` });
    return result.action === Share.dismissedAction ? "dismissed" : "shared";
  }
}

// El enlace que abre un proyecto: en la web, la dirección de la app; en el
// teléfono, la versión web publicada (`EXPO_PUBLIC_WEB_URL`) si se configuró
// y, si no, el enlace propio de la app (`campusinnovate://proyecto/…`).
export function projectLink(listingId: string): string {
  const path = `proyecto/${listingId}`;
  if (Platform.OS === "web" && typeof window !== "undefined") return `${window.location.origin}/${path}`;
  const web = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/+$/, "");
  return web ? `${web}/${path}` : appUrl(path);
}
