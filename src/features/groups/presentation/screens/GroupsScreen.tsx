import { useNavigation } from "@react-navigation/native";
import React from "react";
import { RefreshControl, ScrollView } from "react-native";

import { EmptyState } from "@/src/core/components/EmptyState";
import { ExtendedFab } from "@/src/core/components/Fab";
import { GradientHeader } from "@/src/core/components/GradientHeader";
import { Gap, Loading, Screen, SectionHeader } from "@/src/core/components/Screen";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { useReturnRefresh } from "@/src/core/hooks/useReturnRefresh";
import { useAppTheme } from "@/src/theme/theme";
import { Group, GroupInvitation, isOwner } from "../../domain/entities/Group";
import { GroupCard } from "../components/GroupCard";
import { InvitationCard } from "../components/InvitationCard";
import { useGroupsViewModel } from "../viewmodels/useGroupsViewModel";

// La pestaña Grupos (`groups_page.dart`).
export default function GroupsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const vm = useGroupsViewModel();
  const snackbar = useSnackbar();
  useReturnRefresh(() => vm.load(true));

  const answer = async (action: () => Promise<boolean>, success: string) => {
    const done = await action();
    snackbar(done ? "Listo" : "No se pudo responder", done ? success : (vm.lastActionError() ?? "Intenta de nuevo"));
  };

  const openGroup = (groupId: string) => navigation.navigate("GroupDetail", { groupId });
  const createGroup = () => navigation.navigate("CreateGroup");

  const badgeFor = (group: Group) => (vm.myRequestFor(group) ? "Solicitud pendiente" : null);

  const body = () => {
    if (vm.isLoading) return <Loading />;
    if (vm.error) return <EmptyState icon="alert-circle-outline" title="No se pudieron cargar los grupos" message={vm.error} />;
    return (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => vm.load()} colors={[theme.colors.primary]} />}
      >
        <GradientHeader
          icon="account-group-outline"
          title="Grupos"
          subtitle="Publica proyectos a nombre de un equipo y gestiona quién entra."
          stats={[
            [`${vm.myGroups.length}`, "tuyos"],
            [`${vm.otherGroups.length}`, "en el campus"],
          ]}
        />
        {vm.invitations.length > 0 && (
          <>
            <Gap h={24} />
            <SectionHeader title={`Invitaciones (${vm.invitations.length})`} />
            <Gap h={12} />
            {vm.invitations.map((invitation: GroupInvitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                isBusy={vm.isWorking}
                onOpenGroup={() => openGroup(invitation.groupId)}
                onAccept={() => answer(() => vm.acceptInvitation(invitation), `Ya eres parte de ${invitation.groupName}`)}
                onReject={() => answer(() => vm.rejectInvitation(invitation), "Invitación rechazada")}
              />
            ))}
          </>
        )}
        <Gap h={24} />
        <SectionHeader title="Mis grupos" />
        <Gap h={12} />
        {vm.myGroups.length === 0 ? (
          <EmptyState inline icon="account-group-outline" title="Todavía no tienes grupos" message="Crea uno para publicar proyectos a su nombre." actionLabel="Crear grupo" onAction={createGroup} />
        ) : (
          vm.myGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              projectCount={vm.projectsOf(group)}
              badge={isOwner(group, vm.currentUserId) ? "Creador" : "Integrante"}
              onPress={() => openGroup(group.id)}
            />
          ))
        )}
        <Gap h={24} />
        <SectionHeader title="Otros grupos del campus" />
        <Gap h={12} />
        {vm.otherGroups.length === 0 ? (
          <EmptyState inline icon="earth-off" title="No hay otros grupos por ahora" />
        ) : (
          vm.otherGroups.map((group) => (
            <GroupCard key={group.id} group={group} projectCount={vm.projectsOf(group)} badge={badgeFor(group)} onPress={() => openGroup(group.id)} />
          ))
        )}
      </ScrollView>
    );
  };

  return (
    <Screen>
      {body()}
      <ExtendedFab testID="fab-create-group" icon="plus" label="Crear grupo" onPress={createGroup} />
    </Screen>
  );
}
