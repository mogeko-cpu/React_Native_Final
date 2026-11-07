import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { Gap, Screen } from "@/src/core/components/Screen";
import { T } from "@/src/core/components/T";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { PasswordPolicy } from "@/src/core/roble/passwordPolicy";
import { useAppTheme } from "@/src/theme/theme";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { useSession } from "../context/SessionContext";

// Crear una cuenta (`signup_page.dart`). Crea la cuenta sin entrar: después se
// vuelve al login con un aviso.
export default function RegisterScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const session = useSession();
  const snackbar = useSnackbar();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const value = email.trim();
    const next = {
      name: name.trim().length < 3 ? "Escribe tu nombre completo" : undefined,
      email: !value ? "Escribe tu correo" : !value.includes("@") ? "Escribe un correo válido" : undefined,
      password: PasswordPolicy.validate(password) ?? undefined,
    };
    setErrors(next);
    return !next.name && !next.email && !next.password;
  };

  const submit = async () => {
    if (!validate()) return;
    const created = await session.signUp(name, email, password);
    if (!created) {
      snackbar("No se pudo registrar", session.error || undefined);
      return;
    }
    navigation.goBack();
    snackbar("Cuenta creada", "Ya puedes iniciar sesión con tu correo.");
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <T v="titleLarge" w={700}>
            Tus datos
          </T>
          <Gap h={4} />
          <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
            Tu nombre aparecerá en los proyectos que publiques.
          </T>
          <Gap h={24} />
          <AppTextField
            testID="register-name"
            label="Nombre completo"
            placeholder="Ej. Mariana Ospina"
            autoCapitalize="words"
            autoComplete="name"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          <Gap h={16} />
          <AppTextField
            testID="register-email"
            label="Correo institucional"
            placeholder="nombre@uninorte.edu.co"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />
          <Gap h={16} />
          <AppTextField
            testID="register-password"
            label="Contraseña"
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            error={errors.password}
            helper={`Mínimo ${PasswordPolicy.minLength} caracteres, con mayúscula, minúscula, número y un símbolo (${PasswordPolicy.symbols})`}
          />
          <Gap h={28} />
          <AppButton testID="register-submit" big loading={session.isLoading} onPress={submit}>
            Crear cuenta
          </AppButton>
          <GoogleSignInButton />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
