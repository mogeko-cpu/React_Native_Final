import { RouteProp, useRoute } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { EmptyState } from "@/src/core/components/EmptyState";
import { Icon } from "@/src/core/components/Icon";
import { ListTile } from "@/src/core/components/ListTile";
import { NameAvatar } from "@/src/core/components/NameAvatar";
import { Loading, Screen } from "@/src/core/components/Screen";
import { Card } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { DirectoryUser } from "@/src/features/users/domain/entities/DirectoryUser";
import { RootStackParamList } from "@/src/navigation/types";
import { useAppTheme } from "@/src/theme/theme";
import { useInviteMembersViewModel } from "../viewmodels/useInviteMembersViewModel";

// Invitar personas al grupo (`invite_members_page.dart`).
export default function InviteMembersScreen() {
  const theme = useAppTheme();
  const { groupId } = useRoute<RouteProp<RootStackParamList, "InviteMembers">>().params;
  const vm = useInviteMembersViewModel(groupId);
  const snackbar = useSnackbar();

  const invite = async (person: DirectoryUser) => {
    const sent = await vm.invite(person);
    snackbar(sent ? "Invitación enviada" : "No se pudo invitar", sent ? `${person.name} recibirá una notificación` : (vm.lastActionError() ?? "Intenta de nuevo"));
  };

  const body = () => {
    if (vm.isLoading) return <Loading />;
    if (vm.error) return <EmptyState icon="alert-circle-outline" title="No se pudo cargar" message={vm.error} />;
    if (vm.candidates.length === 0) {
      return (
        <EmptyState
          icon="account-search-outline"
          title={vm.query.trim() ? "Nadie coincide con tu búsqueda" : "No hay nadie más para invitar"}
          message="Solo aparecen las personas que ya abrieron Campus Innovate."
        />
      );
    }
    return (
      <FlatList
        data={vm.candidates}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={vm.load} colors={[theme.colors.primary]} />}
        renderItem={({ item }) => {
          let trailing: React.ReactNode;
          if (vm.sendingTo === item.id) trailing = <ActivityIndicator size="small" color={theme.colors.primary} />;
          else if (vm.isInvited(item)) trailing = <Badge icon label="Invitación enviada" />;
          else if (vm.hasRequested(item)) trailing = <Badge label="Ya solicitó" />;
          else
            trailing = (
              <AppButton testID={`invite-${item.id}`} mode="tonal" disabled={vm.sendingTo != null} onPress={() => invite(item)}>
                Invitar
              </AppButton>
            );
          return (
            <Card style={{ marginBottom: 8 }}>
              <ListTile leading={<NameAvatar name={item.name} radius={18} />} title={item.name} subtitle={item.email || undefined} subtitleLines={1} trailing={trailing} />
            </Card>
          );
        }}
      />
    );
  };

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <AppTextField testID="invite-search" leadingIcon="magnify" placeholder="Buscar por nombre o correo" value={vm.query} onChangeText={vm.setQuery} returnKeyType="search" />
      </View>
      <View style={{ flex: 1 }}>{body()}</View>
    </Screen>
  );
}

function Badge({ label, icon }: { label: string; icon?: boolean }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, height: 32, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.hairline }}>
      {icon && <Icon name="check" size={16} color={theme.colors.primary} style={{ marginRight: 4 }} />}
      <T v="labelMedium">{label}</T>
    </View>
  );
}
