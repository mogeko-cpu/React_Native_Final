import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { IconButton, Menu } from "react-native-paper";

import { LinearProgress } from "@/src/core/components/LinearProgress";

import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton, FilledIconButton } from "@/src/core/components/Buttons";
import { TagChip, Wrap } from "@/src/core/components/Chips";
import { EmptyState } from "@/src/core/components/EmptyState";
import { HeroDecor } from "@/src/core/components/HeroDecor";
import { Icon } from "@/src/core/components/Icon";
import { ListTile } from "@/src/core/components/ListTile";
import { NameAvatar } from "@/src/core/components/NameAvatar";
import { Gap, Loading, Screen } from "@/src/core/components/Screen";
import { Card, InfoBanner, Panel, raisedStyle } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { useConfirm } from "@/src/core/feedback/DialogProvider";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { useReturnRefresh } from "@/src/core/hooks/useReturnRefresh";
import { categoryStyleOf } from "@/src/core/ui/categoryStyle";
import { DirectoryUser } from "@/src/features/users/domain/entities/DirectoryUser";
import { RootStackParamList } from "@/src/navigation/types";
import { alpha, useAppTheme } from "@/src/theme/theme";
import { JoinRequest, requestStatusLabel } from "../../domain/entities/JoinRequest";
import { acceptsRequests, belongsToGroup, isFull, Listing, ListingMember, ListingRole, memberCount, mentorsOf, roleLabel } from "../../domain/entities/Listing";
import { ListingComment } from "../../domain/entities/ListingComment";
import { countedOf, fractionOf, percentOf, progressLabel, TaskProgress } from "../../domain/entities/ListingTask";
import { MentorshipRequest } from "../../domain/entities/MentorshipRequest";
import { CategoryPill } from "../components/CategoryChip";
import { MentorRequestDialog } from "../components/MentorRequestDialog";
import { ReactionBar } from "../components/ReactionBar";
import { StatusChip } from "../components/StatusChip";
import { useListingDetailViewModel } from "../viewmodels/useListingDetailViewModel";
import { useRequestsViewModel } from "../viewmodels/useRequestsViewModel";

const nameOf = (member: { userName: string }) => member.userName || "Integrante sin nombre";

// El detalle de un proyecto (`listing_detail_page.dart`).
export default function ListingDetailScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { listingId } = useRoute<RouteProp<RootStackParamList, "ListingDetail">>().params;
  const vm = useListingDetailViewModel(listingId);
  const confirm = useConfirm();
  const snackbar = useSnackbar();
  const [mentorDialog, setMentorDialog] = useState<DirectoryUser[] | null>(null);
  useReturnRefresh(() => vm.load(true));

  const toast = (title: string, message: string) => snackbar(title, message);

  const confirmDelete = async () => {
    const ok = await confirm({
      title: "¿Eliminar el proyecto?",
      message: "Se van a borrar su equipo, sus solicitudes, sus tareas, sus comentarios y sus valoraciones. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    if (await vm.deleteListing()) {
      navigation.goBack();
      toast("Proyecto eliminado", "Ya no aparece en el campus");
    } else {
      toast("No se pudo eliminar", vm.lastError() ?? "");
    }
  };

  // El líder edita y elimina desde la barra de arriba.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        vm.listing && vm.isLeader ? (
          <View style={{ flexDirection: "row" }}>
            <IconButton
              testID="listing-edit"
              accessibilityLabel="Editar proyecto"
              icon="pencil-outline"
              iconColor={theme.colors.onAppBar}
              disabled={vm.isWorking}
              onPress={() => navigation.navigate("EditListing", { listingId })}
            />
            <IconButton
              testID="listing-delete"
              accessibilityLabel="Eliminar proyecto"
              icon="delete-outline"
              iconColor={theme.colors.onAppBar}
              disabled={vm.isWorking}
              onPress={confirmDelete}
            />
          </View>
        ) : null,
    });
  });

  const remove = async (member: ListingMember) => {
    const name = nameOf(member);
    const ok = await confirm({ title: `¿Quitar a ${name} del equipo?`, message: "Deja de ser parte del proyecto y sus tareas quedan sin asignar.", confirmLabel: "Quitar" });
    if (!ok) return;
    const done = await vm.removeMember(member);
    toast(done ? "Listo" : "No se pudo quitar", done ? `${name} ya no está en el equipo` : (vm.lastError() ?? "Intenta de nuevo"));
  };

  const setRole = async (member: ListingMember, role: ListingRole) => {
    const name = nameOf(member);
    const done = await vm.setRole(member, role);
    toast(done ? "Rol actualizado" : "No se pudo cambiar el rol", done ? `${name} ahora es ${roleLabel(role).toLowerCase()}` : (vm.lastError() ?? "Intenta de nuevo"));
  };

  const transfer = async (member: ListingMember) => {
    const name = nameOf(member);
    const ok = await confirm({ title: "¿Transferir el liderazgo?", message: `${name} pasará a dirigir el proyecto y tú quedarás como integrante.`, confirmLabel: "Transferir" });
    if (!ok) return;
    const done = await vm.transferLeadership(member);
    toast(done ? "Liderazgo transferido" : "No se pudo transferir", done ? `${name} ahora lidera el proyecto` : (vm.lastError() ?? "Intenta de nuevo"));
  };

  const leave = async () => {
    const ok = await confirm({ title: "¿Salir del proyecto?", message: "Dejarás de ser parte del equipo y tus tareas quedarán sin asignar.", confirmLabel: "Salir" });
    if (!ok) return;
    const done = await vm.leave();
    toast(done ? "Saliste del proyecto" : "No se pudo salir", done ? "Ya no haces parte del equipo" : (vm.lastError() ?? "Intenta de nuevo"));
  };

  const openMentorDialog = async () => {
    try {
      setMentorDialog(await vm.mentorCandidates());
    } catch {
      toast("No se pudo abrir", "No se pudo leer el directorio de personas");
    }
  };

  const requestMentorship = async (form: { mentor: DirectoryUser; message: string }) => {
    setMentorDialog(null);
    const done = await vm.requestMentorship(form.mentor, form.message);
    toast(done ? "Solicitud enviada" : "No se pudo enviar", done ? `${form.mentor.name} recibirá una notificación` : (vm.lastError() ?? "Intenta de nuevo"));
  };

  const cancelMentorship = async (request: MentorshipRequest) => {
    const ok = await confirm({ title: "¿Cancelar la solicitud?", message: `${request.mentorName} ya no podrá responderla.`, confirmLabel: "Cancelar solicitud" });
    if (!ok) return;
    const done = await vm.cancelMentorshipRequest();
    toast(done ? "Solicitud cancelada" : "No se pudo cancelar", done ? "Pueden pedírsela a otra persona" : (vm.lastError() ?? "Intenta de nuevo"));
  };

  const answerMentorship = async (accept: boolean) => {
    const done = accept ? await vm.acceptMentorship() : await vm.rejectMentorship();
    if (!done) {
      toast("No se pudo responder", vm.lastError() ?? "Intenta de nuevo");
      return;
    }
    toast(
      accept ? "Ahora eres mentor" : "Solicitud rechazada",
      accept ? "Ya puedes seguir el tablero y los archivos del equipo" : "Se le avisó a quien te lo pidió",
    );
  };

  if (vm.isLoading) return <Screen><Loading /></Screen>;
  const listing = vm.listing;
  if (!listing) {
    return (
      <Screen style={{ alignItems: "center", justifyContent: "center" }}>
        <T>{vm.error ?? "Proyecto no encontrado"}</T>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Header listing={listing} />
          <Gap h={16} />
          {vm.isInvitedMentor && vm.mentorshipRequest ? (
            <MentorInvitation request={vm.mentorshipRequest} isBusy={vm.isWorking} onAccept={() => answerMentorship(true)} onReject={() => answerMentorship(false)} />
          ) : (
            <JoinAction
              listing={listing}
              isLeader={vm.isLeader}
              isMember={vm.isMember}
              myRequest={vm.myRequest}
              onJoin={() => navigation.navigate("JoinRequest", { listingId: listing.id })}
            />
          )}
          <Gap h={16} />
          <Panel title="Sobre el proyecto" icon="text">
            <T style={{ lineHeight: 20 }}>{listing.description}</T>
            {listing.requiredSkills.length > 0 && (
              <>
                <T v="labelLarge" w={700} color={theme.colors.onSurfaceVariant} style={{ marginTop: 18, marginBottom: 10 }}>
                  Habilidades buscadas
                </T>
                <Wrap>
                  {listing.requiredSkills.map((skill) => (
                    <TagChip key={skill} label={skill} />
                  ))}
                </Wrap>
              </>
            )}
          </Panel>
          <Gap h={16} />
          <Panel title="Equipo" icon="account-group-outline">
            <TeamSection
              listing={listing}
              team={vm.team}
              currentUserId={vm.currentUserId}
              isLeader={vm.isLeader}
              isBusy={vm.isWorking}
              onRemove={remove}
              onSetRole={setRole}
              onTransfer={transfer}
              onLeave={leave}
            />
          </Panel>
          {vm.myRole != null && (
            <>
              <Gap h={28} />
              <T v="titleMedium" w={700} style={{ marginLeft: 4, marginBottom: 12 }}>
                Espacio del equipo
              </T>
              <TeamSpace
                progress={vm.progress}
                fileCount={vm.fileCount}
                mentors={mentorsOf(listing)}
                pendingMentorship={vm.mentorshipRequest}
                canRequestMentorship={vm.canRequestMentorship}
                canCancelMentorship={vm.canCancelMentorship}
                isBusy={vm.isWorking}
                onOpenTasks={() => navigation.navigate("Tasks", { listingId: listing.id })}
                onOpenFiles={() => navigation.navigate("Files", { listingId: listing.id })}
                onRequestMentorship={openMentorDialog}
                onCancelMentorship={cancelMentorship}
              />
            </>
          )}
          <Gap h={16} />
          <Panel title="Valoración" icon="chart-timeline-variant">
            <ReactionBar stats={vm.stats} isBusy={vm.isWorking} onReact={vm.react} />
          </Panel>
          {vm.isLeader && (
            <>
              <Gap h={16} />
              <Panel title="Solicitudes recibidas" icon="inbox-arrow-down-outline">
                <RequestsInbox listingId={listing.id} listingTitle={listing.title} revision={vm.revision} onResolved={() => vm.load(true)} />
              </Panel>
            </>
          )}
          <Gap h={16} />
          <Panel title={`Comentarios (${vm.stats.comments})`} icon="forum-outline">
            <Comments comments={vm.comments} isBusy={vm.isWorking} canDelete={vm.canDeleteComment} onSend={vm.comment} onDelete={vm.deleteComment} />
          </Panel>
        </ScrollView>
      </KeyboardAvoidingView>
      <MentorRequestDialog visible={mentorDialog != null} candidates={mentorDialog ?? []} onCancel={() => setMentorDialog(null)} onSend={requestMentorship} />
    </Screen>
  );
}

// La cabecera: franja con degradado y el ícono de la categoría, pastillas,
// título, creador y grupo.
function Header({ listing }: { listing: Listing }) {
  const theme = useAppTheme();
  const category = categoryStyleOf(listing.category, theme.colors.primary);
  return (
    <View style={[raisedStyle(theme, 24), { overflow: "hidden" }]}>
      <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 78, overflow: "hidden" }}>
        <HeroDecor color={theme.colors.onPrimary} />
        <View style={{ position: "absolute", right: 18, bottom: -16 }}>
          <Icon name={category.icon} size={96} color={alpha(theme.colors.onPrimary, 0.16)} />
        </View>
      </LinearGradient>
      <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }}>
        <Wrap>
          <CategoryPill category={listing.category} />
          <StatusChip status={listing.status} />
        </Wrap>
        <T v="headlineSmall" w={700} style={{ marginTop: 12 }}>
          {listing.title}
        </T>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
          <NameAvatar name={listing.creatorName} radius={18} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <T w={600}>{listing.creatorName}</T>
            <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
              Creador del proyecto
            </T>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
          <Icon name="account-group-outline" size={17} color={theme.colors.primary} />
          <T v="bodySmall" color={theme.colors.onSurfaceVariant} style={{ flex: 1, marginLeft: 8 }}>
            {belongsToGroup(listing) ? `Publicado por ${listing.groupName || "un grupo del campus"}` : "Publicado sin grupo"}
          </T>
        </View>
      </View>
    </View>
  );
}

// Lo que la persona puede hacer con el proyecto, o por qué no.
function JoinAction({ listing, isLeader, isMember, myRequest, onJoin }: { listing: Listing; isLeader: boolean; isMember: boolean; myRequest: JoinRequest | null; onJoin: () => void }) {
  if (isLeader) return <InfoBanner icon="check-decagram-outline" text="Este es tu proyecto." />;
  if (isMember) return <InfoBanner icon="check-circle-outline" text="Ya formas parte de este equipo." />;
  if (myRequest) return <InfoBanner icon="clock-outline" text={`Solicitud enviada — estado: ${requestStatusLabel(myRequest.status)}.`} />;
  if (listing.status === "done") return <InfoBanner icon="check-circle-outline" text="Este proyecto ya terminó y no recibe solicitudes." />;
  if (!acceptsRequests(listing.status)) return <InfoBanner icon="pause-circle-outline" text="Este proyecto está pausado y no recibe solicitudes por ahora." />;
  if (isFull(listing)) return <InfoBanner icon="account-multiple-remove-outline" text="El equipo ya está completo." />;
  return (
    <AppButton testID="join-open" big icon="account-multiple-plus-outline" onPress={onJoin}>
      Solicitar unirme
    </AppButton>
  );
}

function TeamSection({
  listing,
  team,
  currentUserId,
  isLeader,
  isBusy,
  onRemove,
  onSetRole,
  onTransfer,
  onLeave,
}: {
  listing: Listing;
  team: ListingMember[];
  currentUserId: string;
  isLeader: boolean;
  isBusy: boolean;
  onRemove: (m: ListingMember) => void;
  onSetRole: (m: ListingMember, role: ListingRole) => void;
  onTransfer: (m: ListingMember) => void;
  onLeave: () => void;
}) {
  const theme = useAppTheme();
  const isOnTeam = team.some((m) => m.userId === currentUserId);
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Icon name="account-multiple-outline" color={theme.colors.primary} />
        <T style={{ marginLeft: 10, flex: 1 }}>{`${memberCount(listing)} de ${listing.maxMembers} integrantes`}</T>
      </View>
      <Gap h={8} />
      {team.map((member) => (
        <MemberTile
          key={member.userId}
          member={member}
          isMe={member.userId === currentUserId}
          canManage={isLeader && member.userId !== currentUserId && member.role !== "leader"}
          isBusy={isBusy}
          onRemove={() => onRemove(member)}
          onToggleMentor={() => onSetRole(member, member.role === "mentor" ? "member" : "mentor")}
          onTransfer={() => onTransfer(member)}
        />
      ))}
      {isOnTeam && !isLeader && (
        <AppButton testID="listing-leave" mode="outlined" icon="logout" disabled={isBusy} onPress={onLeave} style={{ marginTop: 8, alignSelf: "flex-start" }}>
          Salir del proyecto
        </AppButton>
      )}
    </View>
  );
}

function MemberTile({
  member,
  isMe,
  canManage,
  isBusy,
  onRemove,
  onToggleMentor,
  onTransfer,
}: {
  member: ListingMember;
  isMe: boolean;
  canManage: boolean;
  isBusy: boolean;
  onRemove: () => void;
  onToggleMentor: () => void;
  onTransfer: () => void;
}) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  return (
    <ListTile
      padded={false}
      leading={<NameAvatar name={member.userName} radius={17} />}
      title={nameOf(member)}
      subtitle={isMe ? `${roleLabel(member.role)} · tú` : roleLabel(member.role)}
      trailing={
        canManage ? (
          <Menu
            visible={open}
            onDismiss={() => setOpen(false)}
            contentStyle={{ backgroundColor: theme.colors.raised, borderRadius: 14 }}
            anchor={<IconButton testID={`member-menu-${member.userId}`} accessibilityLabel={`Opciones de ${nameOf(member)}`} icon="dots-vertical" disabled={isBusy} onPress={() => setOpen(true)} />}
          >
            <Menu.Item title={member.role === "mentor" ? "Hacer integrante" : "Hacer mentor"} onPress={choose(onToggleMentor)} />
            <Menu.Item title="Transferir liderazgo" onPress={choose(onTransfer)} />
            <Menu.Item title="Quitar del proyecto" onPress={choose(onRemove)} />
          </Menu>
        ) : undefined
      }
    />
  );
}

// Tareas, archivos y mentoría: lo que solo ve el equipo.
function TeamSpace({
  progress,
  fileCount,
  mentors,
  pendingMentorship,
  canRequestMentorship,
  canCancelMentorship,
  isBusy,
  onOpenTasks,
  onOpenFiles,
  onRequestMentorship,
  onCancelMentorship,
}: {
  progress: TaskProgress | null;
  fileCount: number | null;
  mentors: ListingMember[];
  pendingMentorship: MentorshipRequest | null;
  canRequestMentorship: boolean;
  canCancelMentorship: boolean;
  isBusy: boolean;
  onOpenTasks: () => void;
  onOpenFiles: () => void;
  onRequestMentorship: () => void;
  onCancelMentorship: (request: MentorshipRequest) => void;
}) {
  const theme = useAppTheme();
  const muted = theme.colors.onSurfaceVariant;
  const filesText =
    fileCount == null
      ? "Documentos, imágenes y enlaces del equipo."
      : fileCount === 0
        ? "Todavía no han compartido archivos."
        : fileCount === 1
          ? "1 archivo o enlace compartido."
          : `${fileCount} archivos y enlaces compartidos.`;

  const mentorshipBody = () => {
    if (mentors.length > 0) {
      return mentors.map((mentor) => (
        <ListTile key={mentor.userId} padded={false} leading={<NameAvatar name={mentor.userName} radius={17} />} title={nameOf(mentor)} subtitle="Acompaña al equipo" />
      ));
    }
    if (pendingMentorship) {
      return (
        <View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <NameAvatar name={pendingMentorship.mentorName} radius={17} />
            <T style={{ flex: 1, marginLeft: 12 }}>{`Esperando la respuesta de ${pendingMentorship.mentorName}.`}</T>
          </View>
          {pendingMentorship.message !== "" && (
            <T v="bodySmall" color={muted} style={{ marginTop: 10 }}>
              {`"${pendingMentorship.message}"`}
            </T>
          )}
          {canCancelMentorship && (
            <AppButton mode="text" disabled={isBusy} onPress={() => onCancelMentorship(pendingMentorship)} style={{ alignSelf: "flex-start", marginTop: 8 }}>
              Cancelar solicitud
            </AppButton>
          )}
        </View>
      );
    }
    return (
      <View>
        <T v="bodySmall" color={muted}>
          El proyecto aún no tiene mentor. Pídele a un profesor o a alguien con experiencia que acompañe al equipo: recibirá una notificación y podrá aceptar o rechazar.
        </T>
        {canRequestMentorship && (
          <AppButton testID="mentorship-request" mode="tonal" icon="account-search-outline" disabled={isBusy} onPress={onRequestMentorship} style={{ alignSelf: "flex-start", marginTop: 12 }}>
            Solicitar mentoría
          </AppButton>
        )}
      </View>
    );
  };

  return (
    <View>
      <Panel
        title="Tareas"
        icon="view-column-outline"
        trailing={
          progress && countedOf(progress) > 0 ? (
            <T v="titleMedium" w={800} color={theme.colors.primary}>
              {`${percentOf(progress)}%`}
            </T>
          ) : undefined
        }
      >
        {progress == null ? (
          <T v="bodySmall" color={theme.colors.error}>
            No se pudo leer el tablero.
          </T>
        ) : (
          <>
            <T>{progress.total === 0 ? "Todavía no hay tareas" : progressLabel(progress)}</T>
            <LinearProgress progress={fractionOf(progress)} color={theme.colors.primary} track={theme.colors.primaryContainer} style={{ marginTop: 8 }} />
            {progress.cancelled > 0 && (
              <T v="bodySmall" color={muted} style={{ marginTop: 6 }}>
                {progress.cancelled === 1 ? "1 cancelada, fuera de la cuenta" : `${progress.cancelled} canceladas, fuera de la cuenta`}
              </T>
            )}
          </>
        )}
        <AppButton testID="open-tasks" mode="tonal" icon="view-column-outline" onPress={onOpenTasks} style={{ alignSelf: "flex-start", marginTop: 14 }}>
          Ver tablero
        </AppButton>
      </Panel>
      <Gap h={12} />
      <Panel title="Archivos" icon="folder-account-outline" accent="#1B8B9E">
        <T v="bodySmall" color={muted}>
          {filesText}
        </T>
        <AppButton testID="open-files" mode="tonal" icon="folder-open-outline" onPress={onOpenFiles} style={{ alignSelf: "flex-start", marginTop: 12 }}>
          Ver archivos
        </AppButton>
      </Panel>
      <Gap h={12} />
      <Panel title="Mentoría" icon="school-outline" accent={theme.colors.tertiary}>
        {mentorshipBody()}
      </Panel>
    </View>
  );
}

// Lo que ve la persona a quien le pidieron ser mentor.
function MentorInvitation({ request, isBusy, onAccept, onReject }: { request: MentorshipRequest; isBusy: boolean; onAccept: () => void; onReject: () => void }) {
  const theme = useAppTheme();
  return (
    <Panel title={`${request.requesterName} te pidió ser mentor de este proyecto`} icon="school-outline" accent={theme.colors.tertiary}>
      {request.message !== "" && <T style={{ marginBottom: 10 }}>{`"${request.message}"`}</T>}
      <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
        Si aceptas, entras al equipo como mentor: verás su tablero y sus archivos, sin ocupar un cupo.
      </T>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 14, gap: 8 }}>
        <AppButton mode="text" disabled={isBusy} onPress={onReject}>
          Rechazar
        </AppButton>
        <AppButton testID="mentorship-accept" disabled={isBusy} onPress={onAccept}>
          Aceptar
        </AppButton>
      </View>
    </Panel>
  );
}

// Las solicitudes que esperan respuesta del líder.
function RequestsInbox({ listingId, listingTitle, revision, onResolved }: { listingId: string; listingTitle: string; revision: number; onResolved: () => void }) {
  const theme = useAppTheme();
  const requests = useRequestsViewModel();
  const snackbar = useSnackbar();
  const { load } = requests;

  useEffect(() => {
    load(listingId, listingTitle);
  }, [load, listingId, listingTitle, revision]);

  const resolve = async (request: JoinRequest, accept: boolean) => {
    if (accept) await requests.accept(request.id);
    else await requests.reject(request.id);
    const failure = requests.lastError();
    if (failure) {
      snackbar("Error", failure);
      return;
    }
    onResolved();
    snackbar(accept ? "Solicitud aceptada" : "Solicitud rechazada", accept ? `${request.applicantName} ya hace parte del equipo` : "La persona verá el estado en su perfil");
  };

  if (requests.isLoading) return <Loading padded />;
  if (requests.error) return <InfoBanner icon="alert-circle-outline" text={requests.error} tint={theme.colors.error} />;
  if (requests.pending.length === 0) return <EmptyState inline icon="inbox-outline" title="No hay solicitudes pendientes" />;
  return (
    <View>
      {requests.pending.map((request) => (
        <Card key={request.id} style={{ marginBottom: 12 }}>
          <View style={{ padding: 16 }}>
            <T v="titleSmall" w={700}>
              {request.applicantName}
            </T>
            <Gap h={8} />
            <Field label="Motivación" value={request.motivation} />
            <Field label="Habilidades" value={request.skills} />
            <Field label="Disponibilidad" value={request.availability} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10, gap: 8 }}>
              <AppButton mode="text" textColor={theme.colors.outline} onPress={() => resolve(request, false)}>
                Rechazar
              </AppButton>
              <AppButton testID={`request-accept-${request.id}`} onPress={() => resolve(request, true)}>
                Aceptar
              </AppButton>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  if (!value) return null;
  return (
    <T v="bodySmall" color={theme.colors.onSurfaceVariant} style={{ marginBottom: 6 }}>
      <T v="bodySmall" w={700} color={theme.colors.onSurfaceVariant}>{`${label}: `}</T>
      {value}
    </T>
  );
}

function Comments({
  comments,
  isBusy,
  canDelete,
  onSend,
  onDelete,
}: {
  comments: ListingComment[];
  isBusy: boolean;
  canDelete: (c: ListingComment) => boolean;
  onSend: (body: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const send = async () => {
    const body = text.trim();
    if (!body) return;
    if (await onSend(body)) setText("");
  };
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <View style={{ flex: 1 }}>
          <AppTextField testID="comment-input" placeholder="Escribe un comentario" multiline numberOfLines={1} value={text} onChangeText={setText} />
        </View>
        <View style={{ marginLeft: 8, marginBottom: 4 }}>
          <FilledIconButton testID="comment-send" accessibilityLabel="Enviar comentario" icon="send" disabled={isBusy} onPress={send} />
        </View>
      </View>
      <Gap h={16} />
      {comments.length === 0 ? (
        <EmptyState inline icon="comment-outline" title="Todavía no hay comentarios" message="Sé la primera persona en escribir algo." />
      ) : (
        comments.map((comment) => (
          <View key={comment.id} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
            <NameAvatar name={comment.authorName} radius={15} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <T v="bodySmall" w={700}>
                {comment.authorName}
              </T>
              <T style={{ marginTop: 2 }}>{comment.body}</T>
            </View>
            {canDelete(comment) && (
              <IconButton accessibilityLabel="Eliminar comentario" icon="close" size={18} style={{ margin: 0 }} disabled={isBusy} onPress={() => onDelete(comment.id)} />
            )}
          </View>
        ))
      )}
    </View>
  );
}

