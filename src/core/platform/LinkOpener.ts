import { Linking, Platform } from "react-native";

// Abre un enlace fuera de la app (`url_link_opener.dart`). `false` si el
// teléfono no tiene con qué abrirlo.
export interface LinkOpener {
  open(url: string): Promise<boolean>;
}

export class SystemLinkOpener implements LinkOpener {
  async open(url: string): Promise<boolean> {
    try {
      if (Platform.OS === "web") {
        window.open(url, "_blank", "noopener");
        return true;
      }
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }
}
