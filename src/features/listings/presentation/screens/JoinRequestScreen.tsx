import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { Gap, Screen } from "@/src/core/components/Screen";
import { T } from "@/src/core/components/T";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { RootStackParamList } from "@/src/navigation/types";
import { useAppTheme } from "@/src/theme/theme";
import { useJoinRequestViewModel } from "../viewmodels/useJoinRequestViewModel";

// Postularse a un proyecto (`join_request_page.dart`).
export default function JoinRequestScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { listingId } = useRoute<RouteProp<RootStackParamList, "JoinRequest">>().params;
  const vm = useJoinRequestViewModel(listingId);
  const snackbar = useSnackbar();
  const [motivation, setMotivation] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const submit = async () => {
    const next = {
      motivation: motivation.trim().length < 15 ? "Cuéntanos tu motivación en al menos 15 caracteres" : undefined,
      skills: !skills.trim() ? "Indica al menos una habilidad" : undefined,
      availability: !availability.trim() ? "Indica tu disponibilidad" : undefined,
    };
    setErrors(next);
    if (next.motivation || next.skills || next.availability) return;
    const sent = await vm.submit({ motivation, skills, availability });
    if (!sent) {
      snackbar("Error", vm.lastError() ?? "No se pudo enviar la solicitud");
      return;
    }
    navigation.goBack();
    snackbar("Solicitud enviada", "El creador del proyecto revisará tu postulación");
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <T v="titleLarge" w={700}>
            Preséntate al equipo
          </T>
          <Gap h={4} />
          <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
            El creador usará esta información para decidir tu postulación.
          </T>
          <Gap h={24} />
          <AppTextField testID="join-motivation" label="¿Por qué quieres participar?" multiline numberOfLines={4} value={motivation} onChangeText={setMotivation} error={errors.motivation} />
          <Gap h={16} />
          <AppTextField testID="join-skills" label="¿Qué habilidades aportas?" placeholder="Ej. React Native, investigación de usuarios" value={skills} onChangeText={setSkills} error={errors.skills} />
          <Gap h={16} />
          <AppTextField
            testID="join-availability"
            label="Disponibilidad semanal"
            placeholder="Ej. 6 horas, martes y jueves en la tarde"
            value={availability}
            onChangeText={setAvailability}
            error={errors.availability}
          />
          <Gap h={32} />
          <AppButton testID="join-submit" big loading={vm.isSending} onPress={submit}>
            Enviar solicitud
          </AppButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
