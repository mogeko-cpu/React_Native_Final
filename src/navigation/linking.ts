import { LinkingOptions } from "@react-navigation/native";

import { appUrl } from "../core/platform/appUrl";
import { RootStackParamList } from "./types";

// Las direcciones de la app (`/proyecto/<id>`, `campusinnovate://proyecto/<id>`):
// es lo que abre un proyecto compartido. En la web, además, cada pantalla
// queda con una dirección legible y el botón «Atrás» del navegador funciona.
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [appUrl("/"), "campusinnovate://"],
  config: {
    screens: {
      Login: "entrar",
      Register: "registro",
      VerifyEmail: "verificar",
      ForgotPassword: "recuperar",
      ResetPassword: "restablecer",
      Tabs: {
        screens: {
          Home: "",
          Explore: "explorar",
          Ranking: "ranking",
          Groups: "grupos",
          Profile: "perfil",
        },
      },
      ListingDetail: "proyecto/:listingId",
      GroupDetail: "grupo/:groupId",
      Notifications: "notificaciones",
    },
  },
};
