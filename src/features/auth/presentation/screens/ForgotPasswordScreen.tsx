import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { Gap } from "@/src/core/components/Screen";
import { RootStackParamList } from "@/src/navigation/types";
import { AuthFormScreen } from "../components/AuthFormScreen";
import { useAccountViewModel } from "../viewmodels/useAccountViewModel";

// Recuperar la contraseña, paso 1: el correo. Roble manda el código y no dice
// si la cuenta existe, así que la pantalla siempre sigue al paso 2.
export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "ForgotPassword">>();
  const vm = useAccountViewModel();
  const [email, setEmail] = useState(route.params?.email ?? "");

  const submit = async () => {
    if (await vm.requestPasswordReset(email)) navigation.navigate("ResetPassword", { email: email.trim() });
  };

  return (
    <AuthFormScreen
      icon="lock-reset"
      title="¿Olvidaste tu contraseña?"
      subtitle="Escribe el correo de tu cuenta y te enviaremos un código para crear una contraseña nueva."
    >
      <AppTextField
        testID="forgot-email"
        label="Correo institucional"
        placeholder="nombre@uninorte.edu.co"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          vm.clearError();
        }}
        onSubmitEditing={submit}
        error={vm.error}
      />
      <Gap h={28} />
      <AppButton testID="forgot-submit" big loading={vm.isLoading} onPress={submit}>
        Enviar código
      </AppButton>
      <Gap h={8} />
      <AppButton mode="text" onPress={() => navigation.navigate("ResetPassword", { email: email.trim() })}>
        Ya tengo un código
      </AppButton>
    </AuthFormScreen>
  );
}
