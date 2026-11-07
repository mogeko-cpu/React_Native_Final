import React from "react";
import { View } from "react-native";

import { TagChip, Wrap } from "@/src/core/components/Chips";
import { Icon } from "@/src/core/components/Icon";
import { NameAvatar } from "@/src/core/components/NameAvatar";
import { Card } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { useAppTheme } from "@/src/theme/theme";
import { acceptsRequests, availableSlots, belongsToGroup, isFull, Listing, memberCount } from "../../domain/entities/Listing";
import { ListingStats } from "../../domain/entities/ListingStats";
import { CategoryPill } from "./CategoryChip";
import { ListingStatsRow } from "./ListingStatsRow";
import { StatusChip } from "./StatusChip";

// La tarjeta de un proyecto (`listing_card.dart`): categoría, estado, cupos,
// título, descripción, habilidades, grupo, cifras y quién lo creó.
export function ListingCard({
  listing,
  stats,
  leading,
  onPress,
}: {
  listing: Listing;
  stats?: ListingStats;
  leading?: React.ReactNode;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Card onPress={onPress} testID={`listing-card-${listing.id}`}>
      <View style={{ padding: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {leading != null && <View style={{ marginRight: 10 }}>{leading}</View>}
          <CategoryPill category={listing.category} />
          {listing.status !== "idea" && (
            <View style={{ marginLeft: 6 }}>
              <StatusChip status={listing.status} />
            </View>
          )}
          <View style={{ flex: 1 }} />
          {acceptsRequests(listing.status) && <SlotsBadge listing={listing} />}
        </View>
        <T v="titleLarge" w={700} style={{ marginTop: 12 }}>
          {listing.title}
        </T>
        <T v="bodyMedium" color={theme.colors.onSurfaceVariant} numberOfLines={2} style={{ marginTop: 6 }}>
          {listing.description}
        </T>
        {listing.requiredSkills.length > 0 && (
          <Wrap gap={6} style={{ marginTop: 12 }}>
            {listing.requiredSkills.map((skill) => (
              <TagChip key={skill} label={skill} compact />
            ))}
          </Wrap>
        )}
        {belongsToGroup(listing) && (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
            <Icon name="account-group-outline" size={15} color={theme.colors.onSurfaceVariant} />
            <T v="bodySmall" color={theme.colors.onSurfaceVariant} numberOfLines={1} style={{ marginLeft: 5, flex: 1 }}>
              {listing.groupName || "Grupo del campus"}
            </T>
          </View>
        )}
        {stats && (
          <View style={{ marginTop: 12 }}>
            <ListingStatsRow stats={stats} />
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
          <NameAvatar name={listing.creatorName} radius={13} />
          <T v="bodySmall" numberOfLines={1} style={{ flex: 1, marginLeft: 8 }}>
            {listing.creatorName}
          </T>
          <Icon name="account-multiple-outline" size={16} color={theme.colors.outline} />
          <T v="bodySmall" style={{ marginLeft: 4 }}>
            {`${memberCount(listing)}/${listing.maxMembers}`}
          </T>
        </View>
      </View>
    </Card>
  );
}

function SlotsBadge({ listing }: { listing: Listing }) {
  const theme = useAppTheme();
  if (isFull(listing)) {
    return (
      <T v="labelSmall" w={600} color={theme.colors.outline}>
        Equipo completo
      </T>
    );
  }
  const slots = availableSlots(listing);
  return (
    <T v="labelSmall" w={700} color={theme.colors.primary}>
      {slots === 1 ? "1 cupo libre" : `${slots} cupos libres`}
    </T>
  );
}
