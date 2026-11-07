import React from "react";
import { View } from "react-native";
import { Divider } from "react-native-paper";

import { AppButton } from "@/src/core/components/Buttons";
import { T } from "@/src/core/components/T";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { useAppTheme } from "@/src/theme/theme";
import { useSession } from "../context/SessionContext";

// «o / Continuar con Google» (`google_sign_in_button.dart`). Entrar y
// registrarse con Google son el mismo acto, así que va en las dos pantallas.
export function GoogleSignInButton() {
  const theme = useAppTheme();
  const session = useSession();
  const snackbar = useSnackbar();

  const start = async () => {
    const started = await session.signInWithGoogle();
    if (!started) snackbar("No se pudo continuar con Google", session.error || undefined);
  };

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 20 }}>
        <Divider style={{ flex: 1 }} />
        <T v="bodySmall" color={theme.colors.onSurfaceVariant} style={{ marginHorizontal: 12 }}>
          o
        </T>
        <Divider style={{ flex: 1 }} />
      </View>
      <AppButton mode="outlined" big disabled={session.isLoading} onPress={start} icon="google" testID="google-sign-in">
        Continuar con Google
      </AppButton>
    </View>
  );
}
