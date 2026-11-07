import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

import { AppDialog } from "@/src/core/components/AppDialog";
import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { Icon } from "@/src/core/components/Icon";
import { ListTile } from "@/src/core/components/ListTile";
import { NameAvatar } from "@/src/core/components/NameAvatar";
import { Gap } from "@/src/core/components/Screen";
import { T } from "@/src/core/components/T";
import { DirectoryUser } from "@/src/features/users/domain/entities/DirectoryUser";
import { useAppTheme } from "@/src/theme/theme";
import { MAX_MENTORSHIP_MESSAGE } from "../../domain/repositories/MentorshipRepository";

// Elegir a quién pedirle la mentoría y escribirle por qué
// (`mentor_request_dialog.dart`).
export function MentorRequestDialog({
  visible,
  candidates,
  onCancel,
  onSend,
}: {
  visible: boolean;
  candidates: DirectoryUser[];
  onCancel: () => void;
  onSend: (form: { mentor: DirectoryUser; message: string }) => void;
}) {
  const theme = useAppTheme();
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [chosen, setChosen] = useState<DirectoryUser | null>(null);

  useEffect(() => {
    if (visible) {
      // Cargar al abrir: el estado cambia después del `await`, no al instante.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch("");
      setMessage("");
      setChosen(null);
    }
  }, [visible]);

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return candidates
      .filter((u) => !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [candidates, search]);

  const complete = chosen != null && message.trim() !== "";

  return (
    <AppDialog
      visible={visible}
      title="Solicitar mentoría"
      onDismiss={onCancel}
      scroll
      actions={
        <>
          <AppButton mode="text" onPress={onCancel}>
            Cancelar
          </AppButton>
          <AppButton testID="mentor-send" disabled={!complete} onPress={() => chosen && onSend({ mentor: chosen, message })}>
            Enviar solicitud
          </AppButton>
        </>
      }
    >
      <AppTextField leadingIcon="magnify" placeholder="Buscar por nombre o correo" value={search} onChangeText={setSearch} />
      <Gap h={8} />
      <View style={{ height: 220 }}>
        {matches.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 8 }}>
            <T v="bodySmall" center>
              {candidates.length === 0
                ? "Todavía no hay a quién pedírsela: la persona tiene que haber abierto la app al menos una vez."
                : "Nadie coincide con la búsqueda."}
            </T>
          </View>
        ) : (
          <ScrollView nestedScrollEnabled>
            {matches.map((user) => {
              const selected = chosen?.id === user.id;
              return (
                <ListTile
                  key={user.id}
                  testID={`mentor-candidate-${user.id}`}
                  dense
                  padded={false}
                  selected={selected}
                  leading={<NameAvatar name={user.name} radius={16} />}
                  title={user.name}
                  subtitle={user.email || undefined}
                  trailing={selected ? <Icon name="check-circle" color={theme.colors.primary} /> : undefined}
                  onPress={() => setChosen(user)}
                  style={{ paddingHorizontal: 8 }}
                />
              );
            })}
          </ScrollView>
        )}
      </View>
      <Gap h={8} />
      <AppTextField
        testID="mentor-message"
        label="Mensaje"
        placeholder="¿En qué necesita acompañamiento el equipo?"
        multiline
        numberOfLines={3}
        maxLength={MAX_MENTORSHIP_MESSAGE}
        showCounter
        value={message}
        onChangeText={setMessage}
      />
    </AppDialog>
  );
}
