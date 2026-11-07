import { useNavigation } from "@react-navigation/native";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/core/components/EmptyState";
import { Hero, onHero } from "@/src/core/components/Hero";
import { Icon } from "@/src/core/components/Icon";
import { Gap, Loading, Screen, SectionHeader } from "@/src/core/components/Screen";
import { Card } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { useConfirm } from "@/src/core/feedback/DialogProvider";
import { useReturnRefresh } from "@/src/core/hooks/useReturnRefresh";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { MentorshipRequest } from "@/src/features/listings/domain/entities/MentorshipRequest";
import { ListingCard } from "@/src/features/listings/presentation/components/ListingCard";
import { NotificationBell } from "@/src/features/notifications/presentation/components/NotificationBell";
import { alpha, useAppTheme } from "@/src/theme/theme";
import { ActionCard } from "../components/ActionCard";
import { useHomeViewModel } from "../viewmodels/useHomeViewModel";

// Inicio (`home_page.dart`).
export default function HomeScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const vm = useHomeViewModel();
  const session = useSession();
  const confirm = useConfirm();
  useReturnRefresh(() => vm.load(true));

  const openListing = (listingId: string) => navigation.navigate("ListingDetail", { listingId });

  const confirmLogOut = async () => {
    const ok = await confirm({
      title: "¿Cerrar sesión?",
      message: "Tendrás que volver a escribir tu correo y contraseña para entrar.",
      confirmLabel: "Cerrar sesión",
    });
    if (ok) await session.logOut();
  };

  return (
    <Screen>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => vm.load()} colors={[theme.colors.primary]} />}
        >
          <Greeting name={vm.firstName} onLogOut={confirmLogOut} />
          <Gap h={24} />
          <ActionCard testID="home-publish" icon="plus-circle-outline" title="Publicar idea" subtitle="Arma tu equipo" onPress={() => navigation.navigate("CreateListing")} />
          <Gap h={32} />
          <SectionHeader title="Ideas destacadas" />
          <Gap h={14} />
          {vm.isLoading ? (
            <Loading padded />
          ) : vm.error ? (
            <EmptyState inline icon="alert-circle-outline" title="No se pudieron cargar las ideas" message={vm.error} tint={theme.colors.error} />
          ) : vm.featuredListings.length === 0 ? (
            <EmptyState inline icon="lightbulb-outline" title="Todavía no hay ideas con cupos disponibles" />
          ) : (
            vm.featuredListings.map((listing) => <ListingCard key={listing.id} listing={listing} stats={vm.statsOf(listing)} onPress={() => openListing(listing.id)} />)
          )}
          {vm.mentorshipRequests.length > 0 && (
            <>
              <Gap h={24} />
              <SectionHeader title="Te piden ser mentor" />
              <Gap h={14} />
              {vm.mentorshipRequests.map((request) => (
                <MentorshipRequestTile key={request.id} request={request} onPress={() => openListing(request.listingId)} />
              ))}
            </>
          )}
          <Gap h={24} />
          <SectionHeader title="Mis proyectos" />
          <Gap h={14} />
          {vm.myListings.length === 0 ? (
            <EmptyState inline icon="handshake-outline" title="Aún no participas en ningún proyecto" message="Explora las ideas destacadas o publica la tuya." />
          ) : (
            vm.myListings.map((listing) => <ListingCard key={listing.id} listing={listing} stats={vm.statsOf(listing)} onPress={() => openListing(listing.id)} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

// El saludo con degradado, la campana y cerrar sesión.
function Greeting({ name, onLogOut }: { name: string; onLogOut: () => void }) {
  const theme = useAppTheme();
  const on = theme.colors.onPrimary;
  return (
    <Hero radius={22} padding={22}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Icon name="school-outline" size={20} color={on} />
        <T v="labelMedium" w={800} color={on} style={{ flex: 1, marginLeft: 8, letterSpacing: 1.6 }}>
          CAMPUS INNOVATE
        </T>
        <NotificationBell color={on} />
        <IconButton testID="home-logout" accessibilityLabel="Cerrar sesión" icon="logout" iconColor={on} size={20} style={{ margin: 0 }} onPress={onLogOut} />
      </View>
      <T v="headlineSmall" w={700} color={on} style={{ marginTop: 18 }}>
        {`Hola, ${name}`}
      </T>
      <T v="bodyMedium" color={onHero(theme, 0.85)} style={{ marginTop: 4 }}>
        Encuentra un equipo o publica tu propia idea.
      </T>
    </Hero>
  );
}

function MentorshipRequestTile({ request, onPress }: { request: MentorshipRequest; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Card onPress={onPress} radius={16} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: alpha(theme.colors.tertiary, 0.14), alignItems: "center", justifyContent: "center" }}>
          <Icon name="school-outline" color={theme.colors.tertiary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <T w={700}>{request.listingTitle}</T>
          <T v="bodySmall" color={theme.colors.onSurfaceVariant} style={{ marginTop: 2 }}>
            {`${request.requesterName} te pidió acompañar al equipo`}
          </T>
        </View>
        <Icon name="chevron-right" color={theme.colors.onSurfaceVariant} />
      </View>
    </Card>
  );
}
