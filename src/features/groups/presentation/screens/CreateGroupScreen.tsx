import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { Gap, Screen } from "@/src/core/components/Screen";
import { T } from "@/src/core/components/T";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { useAppTheme } from "@/src/theme/theme";
import { useCreateGroupViewModel } from "../viewmodels/useCreateGroupViewModel";

// Crear un grupo (`create_group_page.dart`).
export default function CreateGroupScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const vm = useCreateGroupViewModel();
  const snackbar = useSnackbar();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const submit = async () => {
    const next = {
      name: name.trim().length < 3 ? "Escribe un nombre de al menos 3 caracteres" : undefined,
      description: description.trim().length < 15 ? "Describe el grupo en al menos 15 caracteres" : undefined,
    };
    setErrors(next);
    if (next.name || next.description) return;
    const group = await vm.submit(name, description);
    if (!group) {
      snackbar("Error", vm.lastError() ?? "No se pudo crear el grupo");
      return;
    }
    navigation.goBack();
    snackbar("Grupo creado", `"${group.name}" ya puede publicar proyectos`);
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <T v="titleLarge" w={700}>
            Arma tu equipo
          </T>
          <Gap h={4} />
          <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
            Los proyectos se publican a nombre de un grupo, y sus integrantes se gestionan desde aquí.
          </T>
          <Gap h={24} />
          <AppTextField testID="group-name" label="Nombre del grupo" placeholder="Ej. Semillero de Robótica" autoCapitalize="words" value={name} onChangeText={setName} error={errors.name} />
          <Gap h={16} />
          <AppTextField
            testID="group-description"
            label="Descripción"
            placeholder="¿En qué trabaja el grupo y a quién busca?"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            error={errors.description}
          />
          <Gap h={32} />
          <AppButton testID="group-submit" big loading={vm.isSaving} onPress={submit}>
            Crear grupo
          </AppButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
