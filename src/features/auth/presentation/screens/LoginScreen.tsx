import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { Icon } from "@/src/core/components/Icon";
import { Gap, Screen } from "@/src/core/components/Screen";
import { T } from "@/src/core/components/T";
import { DummyData } from "@/src/core/data/dummyData";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { useLocalData } from "@/src/core/roble/robleConfig";
import { useAppTheme } from "@/src/theme/theme";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { useSession } from "../context/SessionContext";

// La entrada a la app (`login_page.dart`).
export default function LoginScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const session = useSession();
  const snackbar = useSnackbar();
  const [email, setEmail] = useState(useLocalData ? DummyData.demoEmail : "");
  const [password, setPassword] = useState(useLocalData ? DummyData.demoPassword : "");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Si la app volvió de Google con un error, se dice en el primer cuadro.
  useEffect(() => {
    const pending = session.consumeSocialError();
    if (pending) snackbar("No se pudo entrar con Google", pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const value = email.trim();
    const next = {
      email: !value ? "Escribe tu correo" : !value.includes("@") ? "Escribe un correo válido" : undefined,
      password: !password ? "Escribe tu contraseña" : undefined,
    };
    setErrors(next);
    return !next.email && !next.password;
  };

  const submit = async () => {
    if (!validate()) return;
    const result = await session.login(email, password);
    if (result === "unverified") {
      navigation.navigate("VerifyEmail", { email: email.trim() });
      snackbar("Falta verificar tu correo", "Escribe el código que te llegó al registrarte.");
    } else if (result === "failed") {
      snackbar("No se pudo entrar", session.error || undefined);
    }
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
            <Icon name="school-outline" size={48} color={theme.colors.primary} style={{ alignSelf: "center" }} />
            <Gap h={16} />
            <T v="headlineSmall" w={700} center>
              Campus Innovate
            </T>
            <Gap h={6} />
            <T v="bodyMedium" center color={theme.colors.onSurfaceVariant}>
              Entra para publicar ideas y unirte a proyectos del campus.
            </T>
            <Gap h={36} />
            <AppTextField
              testID="login-email"
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
              testID="login-password"
              label="Contraseña"
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
              error={errors.password}
            />
            <AppButton testID="login-forgot" mode="text" style={{ alignSelf: "flex-end", marginTop: 4 }} onPress={() => navigation.navigate("ForgotPassword", { email: email.trim() })}>
              ¿Olvidaste tu contraseña?
            </AppButton>
            {useLocalData && (
              <T v="bodySmall" color={theme.colors.onSurfaceVariant} style={{ marginTop: 10 }}>
                Modo sin servidor: entra con {DummyData.demoEmail} / {DummyData.demoPassword}
              </T>
            )}
            <Gap h={20} />
            <AppButton testID="login-submit" big loading={session.isLoading} onPress={submit}>
              Iniciar sesión
            </AppButton>
            <GoogleSignInButton />
            <Gap h={12} />
            <AppButton mode="text" onPress={() => navigation.navigate("Register")}>
              Crear una cuenta
            </AppButton>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}
