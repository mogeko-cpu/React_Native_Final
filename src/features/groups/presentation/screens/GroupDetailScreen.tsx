import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { IconButton } from "react-native-paper";

import { AppDialog } from "@/src/core/components/AppDialog";
import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { EmptyState } from "@/src/core/components/EmptyState";
import { Icon } from "@/src/core/components/Icon";
import { ListTile } from "@/src/core/components/ListTile";
import { IconAvatar, NameAvatar } from "@/src/core/components/NameAvatar";
import { Gap, Loading, Screen, SectionHeader } from "@/src/core/components/Screen";
import { Card, InfoBanner } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { useConfirm } from "@/src/core/feedback/DialogProvider";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { useReturnRefresh } from "@/src/core/hooks/useReturnRefresh";
import { RootStackParamList } from "@/src/navigation/types";
import { useAppTheme } from "@/src/theme/theme";
import { Group, groupRequestStatusLabel, isOwner } from "../../domain/entities/Group";
import { InvitationCard } from "../components/InvitationCard";
import { useGroupDetailViewModel } from "../viewmodels/useGroupDetailViewModel";

// El detalle de un grupo (`group_detail_page.dart`).
export default function GroupDetailScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { groupId } = useRoute<RouteProp<RootStackParamList, "GroupDetail">>().params;
  const vm = useGroupDetailViewModel(groupId);
  const confirm = useConfirm();
  const snackbar = useSnackbar();
  const [askingToJoin, setAskingToJoin] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  useReturnRefresh(() => vm.load(true));

  const toast = (title: string, message: string) => snackbar(title, message);

  const confirmDelete = async () => {
    const ok = await confirm({
      title: "¿Eliminar el grupo?",
      message: "Se van a borrar sus integrantes, las solicitudes e invitaciones pendientes y el chat. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    if (await vm.deleteGroup()) {
      navigation.goBack();
      toast("Grupo eliminado", "Ya no aparece en el campus");
    } else {
      toast("No se pudo eliminar", vm.lastError() ?? "");
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        vm.isOwner ? (
          <IconButton testID="group-delete" accessibilityLabel="Eliminar grupo" icon="delete-outline" iconColor={theme.colors.onAppBar} disabled={vm.isWorking} onPress={confirmDelete} />
        ) : null,
    });
  });

  const confirmLeave = async () => {
    const ok = await confirm({ title: "¿Salir del grupo?", message: "Vas a dejar de ser integrante. Puedes volver a solicitar ingreso más adelante.", confirmLabel: "Salir" });
    if (!ok) return;
    if (await vm.leave()) toast("Listo", "Saliste del grupo");
    else toast("Error", vm.lastError() ?? "No se pudo salir del grupo");
  };

  const sendJoinRequest = async () => {
    setAskingToJoin(false);
    const sent = await vm.requestToJoin(joinMessage);
    if (sent) toast("Solicitud enviada", "El creador del grupo la va a revisar");
    else toast("Error", vm.lastError() ?? "No se pudo enviar");
  };

  if (vm.isLoading) return <Screen><Loading /></Screen>;
  const group = vm.group;
  if (!group) {
    return (
      <Screen style={{ alignItems: "center", justifyContent: "center" }}>
        <T>{vm.error ?? "Grupo no encontrado"}</T>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={false} onRefresh={() => vm.load()} colors={[theme.colors.primary]} />}>
        <Header group={group} />
        {vm.error != null && (
          <>
            <Gap h={16} />
            <InfoBanner icon="alert-circle-outline" text={vm.error} tint={theme.colors.error} />
          </>
        )}
        <Gap h={24} />
        {vm.isOwner ? (
          <InfoBanner icon="check-decagram-outline" text="Este grupo es tuyo. Acepta o rechaza las solicitudes abajo." />
        ) : vm.isMember ? (
          <AppButton testID="group-leave" mode="outlined" tall icon="logout" disabled={vm.isWorking} onPress={confirmLeave}>
            Salir del grupo
          </AppButton>
        ) : vm.myInvitation ? (
          <InvitationCard
            invitation={vm.myInvitation}
            isBusy={vm.isWorking}
            onAccept={async () => {
              const done = await vm.acceptMyInvitation();
              toast(done ? "Bienvenido al grupo" : "Error", done ? "Ya eres integrante" : (vm.lastError() ?? "No se pudo aceptar"));
            }}
            onReject={async () => {
              const done = await vm.rejectMyInvitation();
              toast(done ? "Invitación rechazada" : "Error", done ? "Se avisó a quien te invitó" : (vm.lastError() ?? "No se pudo rechazar"));
            }}
          />
        ) : vm.myRequest ? (
          <InfoBanner icon="clock-outline" text={`Solicitud enviada — estado: ${groupRequestStatusLabel(vm.myRequest.status)}.`} />
        ) : (
          <AppButton
            testID="group-request"
            big
            icon="account-multiple-plus-outline"
            disabled={vm.isWorking}
            onPress={() => {
              setJoinMessage("");
              setAskingToJoin(true);
            }}
          >
            Solicitar ingreso
          </AppButton>
        )}
        {vm.isInside && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <AppButton testID="group-chat" mode="tonal" icon="forum-outline" style={{ flex: 1 }} onPress={() => navigation.navigate("GroupChat", { groupId: group.id })}>
              Chat
            </AppButton>
            <AppButton testID="group-invite" mode="tonal" icon="account-plus-outline" style={{ flex: 1 }} onPress={() => navigation.navigate("InviteMembers", { groupId: group.id })}>
              Invitar
            </AppButton>
          </View>
        )}
        <Gap h={28} />
        <SectionHeader size="medium" title="Integrantes" trailing={`${group.members.length}`} />
        <Gap h={10} />
        {group.members.map((member) => (
          <Card key={member.userId} style={{ marginBottom: 10 }}>
            <ListTile
              leading={<NameAvatar name={member.userName} radius={18} />}
              title={member.userName}
              subtitle={isOwner(group, member.userId) ? "Creador" : "Integrante"}
              trailing={
                vm.isOwner && !isOwner(group, member.userId) && !vm.isWorking ? (
                  <IconButton
                    accessibilityLabel="Quitar del grupo"
                    icon="account-remove-outline"
                    onPress={async () => {
                      const removed = await vm.removeMember(member.userId);
                      toast(removed ? "Listo" : "Error", removed ? `${member.userName} salió del grupo` : (vm.lastError() ?? "No se pudo quitar"));
                    }}
                  />
                ) : undefined
              }
            />
          </Card>
        ))}
        {vm.isOwner && (
          <>
            <Gap h={28} />
            <SectionHeader size="medium" title="Solicitudes" trailing={`${vm.pendingRequests.length}`} />
            <Gap h={10} />
            {vm.pendingRequests.length === 0 ? (
              <EmptyState inline icon="inbox-outline" title="No hay solicitudes pendientes" />
            ) : (
              vm.pendingRequests.map((request) => (
                <Card key={request.id} style={{ marginBottom: 10 }}>
                  <View style={{ padding: 16 }}>
                    <T v="titleSmall" w={700}>
                      {request.applicantName}
                    </T>
                    {request.message !== "" && (
                      <T color={theme.colors.onSurfaceVariant} style={{ marginTop: 6 }}>
                        {request.message}
                      </T>
                    )}
                    <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
                      <AppButton
                        mode="text"
                        disabled={vm.isWorking}
                        onPress={async () => {
                          const done = await vm.reject(request.id);
                          toast(done ? "Solicitud rechazada" : "Error", done ? "Se le avisó a la persona" : (vm.lastError() ?? "No se pudo rechazar"));
                        }}
                      >
                        Rechazar
                      </AppButton>
                      <AppButton
                        testID={`group-request-accept-${request.id}`}
                        disabled={vm.isWorking}
                        onPress={async () => {
                          const done = await vm.accept(request.id);
                          toast(done ? "Solicitud aceptada" : "Error", done ? `${request.applicantName} ya es integrante` : (vm.lastError() ?? "No se pudo aceptar"));
                        }}
                      >
                        Aceptar
                      </AppButton>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}
        {vm.isInside && vm.invitations.length > 0 && (
          <>
            <Gap h={28} />
            <SectionHeader size="medium" title="Invitaciones enviadas" trailing={`${vm.invitations.length}`} />
            <Gap h={10} />
            {vm.invitations.map((invitation) => (
              <Card key={invitation.id} style={{ marginBottom: 10 }}>
                <ListTile
                  leading={<NameAvatar name={invitation.inviteeName} radius={18} />}
                  title={invitation.inviteeName}
                  subtitle={`Invitó ${invitation.inviterName} · pendiente`}
                  trailing={
                    vm.canCancel(invitation) ? (
                      <IconButton
                        accessibilityLabel="Cancelar invitación"
                        icon="close"
                        disabled={vm.isWorking}
                        onPress={async () => {
                          const done = await vm.cancelInvitation(invitation.id);
                          toast(done ? "Invitación cancelada" : "Error", done ? "Ya no está pendiente" : (vm.lastError() ?? "No se pudo cancelar"));
                        }}
                      />
                    ) : undefined
                  }
                />
              </Card>
            ))}
          </>
        )}
        <Gap h={28} />
        <SectionHeader size="medium" title="Proyectos del grupo" trailing={`${vm.projects.length}`} />
        <Gap h={10} />
        {vm.projects.length === 0 ? (
          <EmptyState inline icon="briefcase-outline" title="Este grupo todavía no ha publicado proyectos" />
        ) : (
          vm.projects.map((listing) => (
            <Card key={listing.id} style={{ marginBottom: 10 }}>
              <ListTile
                title={listing.title}
                subtitle={`${listing.memberIds.length} de ${listing.maxMembers} integrantes · ${listing.category}`}
                trailing={<Icon name="chevron-right" color={theme.colors.onSurfaceVariant} />}
                onPress={() => navigation.navigate("ListingDetail", { listingId: listing.id })}
              />
            </Card>
          ))
        )}
      </ScrollView>
      <AppDialog
        visible={askingToJoin}
        title="Solicitar ingreso"
        onDismiss={() => setAskingToJoin(false)}
        actions={
          <>
            <AppButton mode="text" onPress={() => setAskingToJoin(false)}>
              Cancelar
            </AppButton>
            <AppButton testID="group-request-send" onPress={sendJoinRequest}>
              Enviar
            </AppButton>
          </>
        }
      >
        <AppTextField testID="group-request-message" placeholder="¿Por qué quieres entrar y qué aportas?" multiline numberOfLines={3} value={joinMessage} onChangeText={setJoinMessage} autoFocus />
      </AppDialog>
    </Screen>
  );
}

function Header({ group }: { group: Group }) {
  const theme = useAppTheme();
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <IconAvatar radius={24} color={theme.colors.primaryContainer}>
          <Icon name="account-group-outline" color={theme.colors.onPrimaryContainer} />
        </IconAvatar>
        <T v="headlineSmall" w={700} style={{ flex: 1, marginLeft: 14 }}>
          {group.name}
        </T>
      </View>
      {group.description !== "" && <T style={{ marginTop: 14 }}>{group.description}</T>}
      <T v="bodySmall" color={theme.colors.onSurfaceVariant} style={{ marginTop: 12 }}>
        {`Creado por ${group.ownerName}`}
      </T>
    </View>
  );
}
