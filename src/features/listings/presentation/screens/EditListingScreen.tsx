import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { ChoiceChip, Wrap } from "@/src/core/components/Chips";
import { EmptyState } from "@/src/core/components/EmptyState";
import { Gap, Screen } from "@/src/core/components/Screen";
import { Skeleton } from "@/src/core/components/Skeleton";
import { InfoBanner } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { RootStackParamList } from "@/src/navigation/types";
import { useAppTheme } from "@/src/theme/theme";
import { LISTING_STATUSES, memberCount, statusLabel } from "../../domain/entities/Listing";
import { LISTING_CATEGORIES } from "../../domain/entities/ListingCategory";
import { MAX_TEAM_SIZE } from "../../domain/repositories/ListingRepository";
import { CategoryChoiceChip } from "../components/CategoryChip";
import { FormLabel, SkillsEditor, TeamSizeSlider } from "../components/FormPieces";
import { statusStyleOf } from "../components/StatusChip";
import { useEditListingViewModel } from "../viewmodels/useEditListingViewModel";

// Editar un proyecto (`edit_listing_page.dart`). Solo el líder.
export default function EditListingScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { listingId } = useRoute<RouteProp<RootStackParamList, "EditListing">>().params;
  const vm = useEditListingViewModel(listingId);
  const snackbar = useSnackbar();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filled, setFilled] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  // Los campos se llenan una sola vez, cuando llega el proyecto.
  useEffect(() => {
    if (filled || !vm.listing) return;
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(vm.listing.title);
    setDescription(vm.listing.description);
    setFilled(true);
  }, [vm.listing, filled]);

  if (vm.isLoading) return <Screen><Skeleton variant="detail" /></Screen>;
  const listing = vm.listing;
  if (!listing) {
    return (
      <Screen>
        <EmptyState icon="lock-outline" title="No se puede editar" message={vm.error ?? "Proyecto no encontrado"} />
      </Screen>
    );
  }

  const submit = async () => {
    const next = {
      title: title.trim().length < 5 ? "Escribe un título de al menos 5 caracteres" : undefined,
      description: description.trim().length < 20 ? "Describe la idea en al menos 20 caracteres" : undefined,
    };
    setErrors(next);
    if (next.title || next.description) return;
    const saved = await vm.submit(title, description);
    if (!saved) {
      snackbar("No se pudo guardar", vm.lastError() ?? "Intenta de nuevo");
      return;
    }
    navigation.goBack();
    snackbar("Cambios guardados", `"${saved.title}" quedó ${statusLabel(saved.status).toLowerCase()}`);
  };

  const count = memberCount(listing);
  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <AppTextField testID="edit-title" label="Título del proyecto" value={title} onChangeText={setTitle} error={errors.title} />
          <Gap h={16} />
          <AppTextField testID="edit-description" label="Descripción" multiline numberOfLines={5} value={description} onChangeText={setDescription} error={errors.description} />
          <Gap h={24} />
          <FormLabel text="Estado" />
          <Gap h={8} />
          <Wrap>
            {LISTING_STATUSES.map((option) => {
              const style = statusStyleOf(option);
              return (
                <ChoiceChip
                  key={option}
                  testID={`edit-status-${option}`}
                  label={statusLabel(option)}
                  icon={style.icon}
                  iconColor={style.color}
                  selected={vm.status === option}
                  onPress={() => vm.selectStatus(option)}
                />
              );
            })}
          </Wrap>
          {vm.closesRequests && (
            <>
              <Gap h={12} />
              <InfoBanner
                icon="information-outline"
                text="Al guardar, las solicitudes pendientes se rechazan y el proyecto deja de recibir nuevas."
                tint={theme.colors.error}
              />
            </>
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
          {vm.minMembers < MAX_TEAM_SIZE ? (
            <TeamSizeSlider value={vm.maxMembers} min={vm.minMembers} max={MAX_TEAM_SIZE} onChange={vm.setMaxMembers} />
          ) : (
            <T style={{ marginTop: 8 }}>{`${vm.maxMembers} personas`}</T>
          )}
          <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
            {`El equipo ya tiene ${count} ${count === 1 ? "persona" : "personas"}: no puede ser más pequeño.`}
          </T>
          <Gap h={24} />
          <FormLabel text="Habilidades que buscas" />
          <Gap h={8} />
          <SkillsEditor skills={vm.requiredSkills} onAdd={vm.addSkill} onRemove={vm.removeSkill} placeholder="Agregar una habilidad" />
          <Gap h={32} />
          <AppButton testID="edit-submit" big loading={vm.isSaving} onPress={submit}>
            Guardar cambios
          </AppButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
