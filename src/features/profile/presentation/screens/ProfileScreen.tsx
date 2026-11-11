import { useNavigation } from "@react-navigation/native";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { IconButton, SegmentedButtons } from "react-native-paper";

import { EmptyState } from "@/src/core/components/EmptyState";
import { Hero, onHero } from "@/src/core/components/Hero";
import { Icon } from "@/src/core/components/Icon";
import { ListTile } from "@/src/core/components/ListTile";
import { IconAvatar } from "@/src/core/components/NameAvatar";
import { Gap, Screen, SectionHeader } from "@/src/core/components/Screen";
import { Skeleton } from "@/src/core/components/Skeleton";
import { ChoiceChip, Wrap } from "@/src/core/components/Chips";
import { Card, InfoBanner, raisedStyle } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { useConfirm } from "@/src/core/feedback/DialogProvider";
import { useReturnRefresh } from "@/src/core/hooks/useReturnRefresh";
import { IconName } from "@/src/core/ui/icons";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { isOwner } from "@/src/features/groups/domain/entities/Group";
import { requestStatusLabel } from "@/src/features/listings/domain/entities/JoinRequest";
import { memberCount } from "@/src/features/listings/domain/entities/Listing";
import { SkillsEditor } from "@/src/features/listings/presentation/components/FormPieces";
import { ThemeMode, useThemePreference } from "@/src/theme/ThemePreference";
import { useAppTheme } from "@/src/theme/theme";
import { useProfileViewModel } from "../viewmodels/useProfileViewModel";

// Cerrar sesión desde la barra del Perfil.
export function ProfileHeaderActions() {
  const theme = useAppTheme();
  const session = useSession();
  const confirm = useConfirm();
  const logOut = async () => {
    const ok = await confirm({
      title: "¿Cerrar sesión?",
      message: "Tendrás que volver a escribir tu correo y contraseña para entrar.",
      confirmLabel: "Cerrar sesión",
    });
    if (ok) await session.logOut();
  };
  return <IconButton hitSlop={6} testID="profile-logout" accessibilityLabel="Cerrar sesión" icon="logout" iconColor={theme.colors.onAppBar} onPress={logOut} />;
}

// El perfil (`profile_page.dart`).
export default function ProfileScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const vm = useProfileViewModel();
  useReturnRefresh(() => vm.load(true));

  if (vm.isLoading) return <Screen><Skeleton variant="detail" /></Screen>;

  const openListing = (listingId: string) => navigation.navigate("ListingDetail", { listingId });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={false} onRefresh={() => vm.load()} colors={[theme.colors.primary]} />}>
        <Identity initials={vm.initials} name={vm.userName} email={vm.userEmail} />
        {vm.error != null && (
          <>
            <Gap h={16} />
            <EmptyState inline icon="alert-circle-outline" title="No se pudo cargar todo" message={vm.error} tint={theme.colors.error} />
          </>
        )}
        <Gap h={22} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <Stat label="Grupos" value={vm.myGroups.length} />
          <Stat label="Publicados" value={vm.myListings.length} />
          <Stat label="Participaciones" value={vm.participations.length} />
          <Stat label="Me gusta recibidos" value={vm.likesReceived} />
          <Stat label="Vistas" value={vm.viewsReceived} />
        </View>
        <Gap h={28} />
        <SectionHeader size="medium" title="Mis habilidades" />
        <T v="bodySmall" color={theme.colors.onSurfaceVariant} style={{ marginTop: 4 }}>
          Con ellas te recomendamos proyectos en Inicio.
        </T>
        <Gap h={12} />
        {vm.extrasError ? (
          <InfoBanner icon="alert-circle-outline" text={vm.extrasError} tint={theme.colors.error} />
        ) : (
          <>
            <SkillsEditor testID="profile-skill" skills={vm.skills} onAdd={vm.addSkill} onRemove={vm.removeSkill} placeholder="Ej. React Native, Diseño UI" />
            {!!vm.skillError && (
              <T v="bodySmall" color={theme.colors.error} style={{ marginTop: 8 }}>
                {vm.skillError}
              </T>
            )}
            {vm.suggestedSkills.length > 0 && (
              <>
                <T v="labelMedium" color={theme.colors.onSurfaceVariant} style={{ marginTop: 14, marginBottom: 8 }}>
                  Lo que más piden los proyectos
                </T>
                <Wrap>
                  {vm.suggestedSkills.map((skill) => (
                    <ChoiceChip key={skill} testID={`suggested-skill-${skill}`} label={skill} icon="plus" selected={false} onPress={() => vm.addSkill(skill)} />
                  ))}
                </Wrap>
              </>
            )}
          </>
        )}
        <Gap h={28} />
        <SectionHeader size="medium" title="Guardados" />
        <Gap h={10} />
        {vm.extrasError ? null : vm.saved.length === 0 ? (
          <EmptyState inline icon="bookmark-outline" title="No has guardado proyectos" message="Toca el marcador en un proyecto para volver a él sin buscarlo." />
        ) : (
          vm.saved.map((listing) => (
            <Tile key={listing.id} testID={`saved-${listing.id}`} icon="bookmark-outline" title={listing.title} subtitle={`${listing.category} · ${memberCount(listing)} de ${listing.maxMembers} integrantes`} onPress={() => openListing(listing.id)} />
          ))
        )}
        <Gap h={28} />
        <SectionHeader size="medium" title="Apariencia" />
        <Gap h={10} />
        <AppearanceSelector />
        <Gap h={28} />
        <SectionHeader size="medium" title="Mis grupos" />
        <Gap h={10} />
        {vm.myGroups.length === 0 ? (
          <EmptyState inline icon="account-group-outline" title="Todavía no haces parte de un grupo" actionLabel="Ver grupos" onAction={() => navigation.navigate("Tabs", { screen: "Groups" })} />
        ) : (
          vm.myGroups.map((group) => (
            <Tile
              key={group.id}
              icon="account-group-outline"
              title={group.name}
              subtitle={`${isOwner(group, vm.userId) ? "Creador" : "Integrante"} · ${group.members.length} integrantes`}
              onPress={() => navigation.navigate("GroupDetail", { groupId: group.id })}
            />
          ))
        )}
        <Gap h={24} />
        <SectionHeader size="medium" title="Proyectos que publiqué" />
        <Gap h={10} />
        {vm.myListings.length === 0 ? (
          <EmptyState inline icon="lightbulb-outline" title="Aún no has publicado proyectos" />
        ) : (
          vm.myListings.map((listing) => (
            <Tile key={listing.id} icon="lightbulb-outline" title={listing.title} subtitle={`${memberCount(listing)} de ${listing.maxMembers} integrantes · ${listing.category}`} onPress={() => openListing(listing.id)} />
          ))
        )}
        <Gap h={24} />
        <SectionHeader size="medium" title="Proyectos en los que participo" />
        <Gap h={10} />
        {vm.participations.length === 0 ? (
          <EmptyState inline icon="handshake-outline" title="Todavía no te unes a proyectos de otras personas" />
        ) : (
          vm.participations.map((listing) => (
            <Tile key={listing.id} icon="handshake-outline" title={listing.title} subtitle={`Creado por ${listing.creatorName}`} onPress={() => openListing(listing.id)} />
          ))
        )}
        <Gap h={24} />
        <SectionHeader size="medium" title="Mis solicitudes" />
        <Gap h={10} />
        {vm.myRequests.length === 0 ? (
          <EmptyState inline icon="send-outline" title="No has enviado solicitudes" />
        ) : (
          vm.myRequests.map((request) => (
            <Tile key={request.id} icon="send-outline" title={requestStatusLabel(request.status)} subtitle={request.motivation || "Solicitud enviada"} onPress={() => openListing(request.listingId)} />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function Identity({ initials, name, email }: { initials: string; name: string; email: string }) {
  const theme = useAppTheme();
  return (
    <Hero radius={22} padding={20}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.onPrimary, alignItems: "center", justifyContent: "center" }}>
          <T v="titleLarge" w={700} color={theme.colors.primary}>
            {initials}
          </T>
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <T v="titleLarge" w={700} color={theme.colors.onPrimary}>
            {name}
          </T>
          {email !== "" && (
            <T v="bodySmall" color={onHero(theme, 0.85)} style={{ marginTop: 4 }}>
              {email}
            </T>
          )}
        </View>
      </View>
    </Hero>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();
  return (
    <View style={[raisedStyle(theme, 16), { paddingHorizontal: 16, paddingVertical: 12 }]}>
      <T v="titleLarge" w={700} color={theme.colors.primary}>
        {String(value)}
      </T>
      <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
        {label}
      </T>
    </View>
  );
}

function Tile({ icon, title, subtitle, onPress, testID }: { icon: IconName; title: string; subtitle: string; onPress: () => void; testID?: string }) {
  const theme = useAppTheme();
  return (
    <Card testID={testID} onPress={onPress} style={{ marginBottom: 10 }}>
      <ListTile
        leading={
          <IconAvatar color={theme.colors.primaryContainer}>
            <Icon name={icon} size={20} color={theme.colors.onPrimaryContainer} />
          </IconAvatar>
        }
        title={title}
        subtitle={subtitle}
        trailing={<Icon name="chevron-right" color={theme.colors.onSurfaceVariant} />}
      />
    </Card>
  );
}

// Claro, oscuro o el del sistema (`_AppearanceSelector`).
function AppearanceSelector() {
  const { mode, setMode } = useThemePreference();
  return (
    <SegmentedButtons
      value={mode}
      onValueChange={(value) => setMode(value as ThemeMode)}
      buttons={[
        { value: "light", label: "Claro", icon: "white-balance-sunny", testID: "theme-light" },
        { value: "dark", label: "Oscuro", icon: "weather-night", testID: "theme-dark" },
        { value: "system", label: "Sistema", icon: "brightness-auto", testID: "theme-system" },
      ]}
    />
  );
}
