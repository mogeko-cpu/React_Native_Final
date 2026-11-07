import { useNavigation } from "@react-navigation/native";
import React from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";

import { AppTextField } from "@/src/core/components/AppTextField";
import { ChoiceChip } from "@/src/core/components/Chips";
import { EmptyState } from "@/src/core/components/EmptyState";
import { ExtendedFab } from "@/src/core/components/Fab";
import { Loading, Screen } from "@/src/core/components/Screen";
import { useReturnRefresh } from "@/src/core/hooks/useReturnRefresh";
import { useAppTheme } from "@/src/theme/theme";
import { LISTING_STATUSES, statusLabel } from "../../domain/entities/Listing";
import { LISTING_CATEGORIES } from "../../domain/entities/ListingCategory";
import { CategoryChoiceChip } from "../components/CategoryChip";
import { ListingCard } from "../components/ListingCard";
import { useListingsViewModel } from "../viewmodels/useListingsViewModel";

// Explorar proyectos (`listings_page.dart`): búsqueda, filtros por categoría y
// por estado, y la lista.
export default function ListingsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const vm = useListingsViewModel();
  useReturnRefresh(() => vm.load(true));

  const body = () => {
    if (vm.isLoading) return <Loading />;
    if (vm.error) return <EmptyState icon="alert-circle-outline" title="No se pudieron cargar los proyectos" message={vm.error} />;
    if (vm.listings.length === 0) {
      return <EmptyState icon="magnify-close" title="Ningún proyecto coincide" message="Prueba con otra categoría o con otro término de búsqueda." />;
    }
    return (
      <FlatList
        data={vm.listings}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => vm.load()} colors={[theme.colors.primary]} />}
        renderItem={({ item }) => (
          <ListingCard listing={item} stats={vm.statsOf(item)} onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })} />
        )}
      />
    );
  };

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <AppTextField
          testID="listings-search"
          leadingIcon="magnify"
          placeholder="Buscar por título o descripción"
          value={vm.query}
          onChangeText={vm.search}
          returnKeyType="search"
        />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, height: 46, alignItems: "center" }}>
          <ChoiceChip label="Todas" selected={vm.selectedCategory == null} onPress={() => vm.filterByCategory(null)} />
          {LISTING_CATEGORIES.map((category) => (
            <CategoryChoiceChip key={category} category={category} selected={vm.selectedCategory === category} onPress={() => vm.filterByCategory(category)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, height: 46, alignItems: "center" }}>
          <ChoiceChip label="Cualquier estado" selected={vm.selectedStatus == null} onPress={() => vm.filterByStatus(null)} />
          {LISTING_STATUSES.map((status) => (
            <ChoiceChip key={status} testID={`status-${status}`} label={statusLabel(status)} selected={vm.selectedStatus === status} onPress={() => vm.filterByStatus(status)} />
          ))}
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>{body()}</View>
      <ExtendedFab testID="fab-publish" icon="plus" label="Publicar" onPress={() => navigation.navigate("CreateListing")} />
    </Screen>
  );
}
