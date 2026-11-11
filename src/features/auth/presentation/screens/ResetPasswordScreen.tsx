import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { Gap } from "@/src/core/components/Screen";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { PasswordPolicy } from "@/src/core/roble/passwordPolicy";
import { RootStackParamList } from "@/src/navigation/types";
import { AuthFormScreen, DemoCodeHint } from "../components/AuthFormScreen";
import { useAccountViewModel } from "../viewmodels/useAccountViewModel";

// Recuperar la contraseña, paso 2: el código del correo y la contraseña nueva,
// revisada con la misma política que el registro antes de gastar una petición.
export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "ResetPassword">>();
  const vm = useAccountViewModel();
  const snackbar = useSnackbar();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<{ code?: string; password?: string; confirmation?: string }>({});
  const email = route.params?.email ?? "";

  const submit = async () => {
    const next = {
      code: code.trim() ? undefined : "Escribe el código que te llegó al correo",
      password: PasswordPolicy.validate(password) ?? undefined,
      confirmation: confirmation === password ? undefined : "Las contraseñas no coinciden",
    };
    setErrors(next);
    if (next.code || next.password || next.confirmation) return;
    if (!(await vm.resetPassword(code, password))) return;
    navigation.navigate("Login");
    snackbar("Contraseña actualizada", "Ya puedes iniciar sesión con la nueva.");
  };

  const resend = async () => {
    if (!email) {
      navigation.navigate("ForgotPassword", {});
      return;
    }
    if (await vm.requestPasswordReset(email)) snackbar("Código enviado", `Revisa ${email}.`);
  };

  return (
    <AuthFormScreen
      icon="email-check-outline"
      title="Crea una contraseña nueva"
      subtitle={email ? `Escribe el código que enviamos a ${email}. También puedes pegar el enlace completo del correo.` : "Escribe el código del correo. También puedes pegar el enlace completo."}
    >
      <AppTextField
        testID="reset-code"
        label="Código"
        autoCapitalize="none"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        value={code}
        onChangeText={setCode}
        error={errors.code ?? vm.error}
      />
      <DemoCodeHint />
      <Gap h={16} />
      <AppTextField
        testID="reset-password"
        label="Contraseña nueva"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        helper={`Mínimo ${PasswordPolicy.minLength} caracteres, con mayúscula, minúscula, número y un símbolo (${PasswordPolicy.symbols})`}
      />
      <Gap h={16} />
      <AppTextField
        testID="reset-confirmation"
        label="Repite la contraseña"
        secureTextEntry
        autoComplete="new-password"
        value={confirmation}
        onChangeText={setConfirmation}
        onSubmitEditing={submit}
        error={errors.confirmation}
      />
      <Gap h={28} />
      <AppButton testID="reset-submit" big loading={vm.isLoading} onPress={submit}>
        Cambiar contraseña
      </AppButton>
      <Gap h={8} />
      <AppButton mode="text" onPress={resend}>
        Enviar otro código
      </AppButton>
    </AuthFormScreen>
  );
}
