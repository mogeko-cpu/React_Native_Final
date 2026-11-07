import { useNavigation } from "@react-navigation/native";
import React from "react";
import { FlatList, RefreshControl, View } from "react-native";

import { EmptyState } from "@/src/core/components/EmptyState";
import { GradientHeader } from "@/src/core/components/GradientHeader";
import { Loading, Screen } from "@/src/core/components/Screen";
import { T } from "@/src/core/components/T";
import { useReturnRefresh } from "@/src/core/hooks/useReturnRefresh";
import { brand, useAppTheme } from "@/src/theme/theme";
import { ListingCard } from "../components/ListingCard";
import { useRankingViewModel } from "../viewmodels/useRankingViewModel";

// El ranking del campus (`ranking_page.dart`).
export default function RankingScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const vm = useRankingViewModel();
  useReturnRefresh(() => vm.load(true));

  if (vm.isLoading) return <Screen><Loading /></Screen>;
  if (vm.error) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="No se pudo cargar el ranking" message={vm.error} />
      </Screen>
    );
  }
  if (vm.ranking.length === 0) {
    return (
      <Screen>
        <EmptyState icon="podium" title="Todavía no hay proyectos publicados" message="Cuando se publiquen, aparecerán aquí ordenados por valoración." />
      </Screen>
    );
  }
  return (
    <Screen>
      <FlatList
        data={vm.ranking}
        keyExtractor={(e) => e.listing.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => vm.load()} colors={[theme.colors.primary]} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            <GradientHeader
              icon="podium"
              title="Ranking del campus"
              subtitle="El puntaje son los me gusta menos los no me gusta; los comentarios y las vistas desempatan."
              stats={[
                [`${vm.ranking.length}`, vm.ranking.length === 1 ? "proyecto" : "proyectos"],
                [`${vm.totalLikes}`, "me gusta en total"],
              ]}
            />
          </View>
        }
        renderItem={({ item }) => (
          <ListingCard
            listing={item.listing}
            stats={item.stats}
            leading={<PositionBadge position={item.position} />}
            onPress={() => navigation.navigate("ListingDetail", { listingId: item.listing.id })}
          />
        )}
      />
    </Screen>
  );
}

// El puesto, dorado en el podio.
function PositionBadge({ position }: { position: number }) {
  const theme = useAppTheme();
  const podium = position <= 3;
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: podium ? brand.gold : theme.colors.surfaceContainerHighest,
      }}
    >
      <T v="labelMedium" w={700} color={podium ? "#FFFFFF" : theme.colors.onSurfaceVariant}>
        {position}
      </T>
    </View>
  );
}
