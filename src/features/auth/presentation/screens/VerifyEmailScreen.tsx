import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { Gap } from "@/src/core/components/Screen";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { RootStackParamList } from "@/src/navigation/types";
import { AuthFormScreen, DemoCodeHint } from "../components/AuthFormScreen";
import { useAccountViewModel } from "../viewmodels/useAccountViewModel";

// Confirmar el correo de una cuenta nueva con el código de 6 dígitos. Llegan
// aquí el registro y quien intenta entrar sin haberlo confirmado.
export default function VerifyEmailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "VerifyEmail">>();
  const vm = useAccountViewModel();
  const snackbar = useSnackbar();
  const [code, setCode] = useState("");
  const { email } = route.params;

  const submit = async () => {
    if (!(await vm.verifyEmail(email, code))) return;
    navigation.navigate("Login");
    snackbar("Correo verificado", "Ya puedes iniciar sesión.");
  };

  const resend = async () => {
    if (await vm.resendVerification(email)) snackbar("Código enviado", `Revisa ${email}, también en correo no deseado.`);
  };

  return (
    <AuthFormScreen icon="email-check-outline" title="Verifica tu correo" subtitle={`Enviamos un código de 6 dígitos a ${email}. Escríbelo para activar tu cuenta.`}>
      <AppTextField
        testID="verify-code"
        label="Código de 6 dígitos"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        value={code}
        onChangeText={(text) => {
          setCode(text.replace(/\D/g, ""));
          vm.clearError();
        }}
        onSubmitEditing={submit}
        error={vm.error}
      />
      <DemoCodeHint />
      <Gap h={28} />
      <AppButton testID="verify-submit" big loading={vm.isLoading} onPress={submit}>
        Verificar
      </AppButton>
      <Gap h={8} />
      <AppButton mode="text" onPress={resend}>
        Reenviar código
      </AppButton>
    </AuthFormScreen>
  );
}
