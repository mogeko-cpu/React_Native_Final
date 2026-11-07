import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { LinearProgress } from "@/src/core/components/LinearProgress";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { ChoiceChip, Wrap } from "@/src/core/components/Chips";
import { Gap, Screen } from "@/src/core/components/Screen";
import { T } from "@/src/core/components/T";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { useReturnRefresh } from "@/src/core/hooks/useReturnRefresh";
import { useAppTheme } from "@/src/theme/theme";
import { LISTING_CATEGORIES } from "../../domain/entities/ListingCategory";
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "../../domain/repositories/ListingRepository";
import { CategoryChoiceChip } from "../components/CategoryChip";
import { FormLabel, SkillsEditor, TeamSizeSlider } from "../components/FormPieces";
import { useCreateListingViewModel } from "../viewmodels/useCreateListingViewModel";

// Publicar una idea (`create_listing_page.dart`).
export default function CreateListingScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const vm = useCreateListingViewModel();
  const snackbar = useSnackbar();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  // Al volver de crear un grupo, aparece en la lista.
  useReturnRefresh(() => vm.loadGroups());

  const submit = async () => {
    const next = {
      title: title.trim().length < 5 ? "Escribe un título de al menos 5 caracteres" : undefined,
      description: description.trim().length < 20 ? "Describe la idea en al menos 20 caracteres" : undefined,
    };
    setErrors(next);
    if (next.title || next.description) return;
    const listing = await vm.submit(title, description);
    if (!listing) {
      snackbar("Error", vm.lastError() ?? "No se pudo crear el proyecto");
      return;
    }
    navigation.goBack();
    snackbar("Proyecto publicado", `"${listing.title}" ya está visible para el campus`);
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <T v="titleLarge" w={700}>
            Cuéntanos tu idea
          </T>
          <Gap h={4} />
          <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
            Entre más claro sea el objetivo, mejores postulantes vas a recibir.
          </T>
          <Gap h={24} />
          <AppTextField
            testID="listing-title"
            label="Título del proyecto"
            placeholder="Ej. Plataforma de tutorías entre pares"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
          />
          <Gap h={16} />
          <AppTextField
            testID="listing-description"
            label="Descripción"
            placeholder="¿Qué problema resuelve y qué esperas lograr?"
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            error={errors.description}
          />
          <Gap h={24} />
          <FormLabel text="Grupo que publica" />
          <Gap h={8} />
          {vm.isLoadingGroups ? (
            <View style={{ paddingVertical: 12 }}>
              <LinearProgress color={theme.colors.primary} track={theme.colors.primaryContainer} height={4} />
            </View>
          ) : vm.hasNoGroups ? (
            <NoGroups onCreate={() => navigation.navigate("CreateGroup")} />
          ) : (
            <Wrap>
              {vm.myGroups.map((group) => (
                <ChoiceChip key={group.id} testID={`group-choice-${group.id}`} label={group.name} selected={vm.selectedGroup?.id === group.id} onPress={() => vm.selectGroup(group)} />
              ))}
            </Wrap>
          )}
          <Gap h={24} />
          <FormLabel text="Categoría" />
          <Gap h={8} />
          <Wrap>
            {LISTING_CATEGORIES.map((category) => (
              <CategoryChoiceChip key={category} category={category} selected={vm.category === category} onPress={() => vm.selectCategory(category)} />
            ))}
          </Wrap>
          <Gap h={24} />
          <FormLabel text="Tamaño del equipo" />
          <TeamSizeSlider value={vm.maxMembers} min={MIN_TEAM_SIZE} max={MAX_TEAM_SIZE} onChange={vm.setMaxMembers} />
          <Gap h={16} />
          <FormLabel text="Habilidades que buscas" />
          <Gap h={8} />
          <SkillsEditor skills={vm.requiredSkills} onAdd={vm.addSkill} onRemove={vm.removeSkill} placeholder="Ej. React Native, Diseño UI, Finanzas" />
          <Gap h={32} />
          <AppButton testID="listing-submit" big loading={vm.isSaving} disabled={vm.hasNoGroups} onPress={submit}>
            Publicar proyecto
          </AppButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// Sin grupos no se puede publicar: se ofrece crear uno.
function NoGroups({ onCreate }: { onCreate: () => void }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
      }}
    >
      <T color={theme.colors.onSurfaceVariant}>Los proyectos se publican a nombre de un grupo y todavía no tienes ninguno.</T>
      <Gap h={12} />
      <AppButton mode="tonal" icon="plus" onPress={onCreate} style={{ alignSelf: "flex-start" }}>
        Crear un grupo
      </AppButton>
    </View>
  );
}
