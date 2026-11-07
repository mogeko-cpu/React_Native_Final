import React from "react";
import { View } from "react-native";

import { Icon } from "@/src/core/components/Icon";
import { T } from "@/src/core/components/T";
import { IconName } from "@/src/core/ui/icons";
import { useAppTheme } from "@/src/theme/theme";
import { ListingStats } from "../../domain/entities/ListingStats";

// Me gusta, no me gusta, vistas y comentarios en una fila (`listing_stats_row.dart`).
export function ListingStatsRow({ stats }: { stats: ListingStats }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: "row", gap: 14 }}>
      <Counter icon="thumb-up-outline" value={stats.likes} color={theme.colors.primary} />
      <Counter icon="thumb-down-outline" value={stats.dislikes} color={theme.colors.outline} />
      <Counter icon="eye-outline" value={stats.views} color={theme.colors.outline} />
      <Counter icon="comment-outline" value={stats.comments} color={theme.colors.outline} />
    </View>
  );
}

function Counter({ icon, value, color }: { icon: IconName; value: number; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Icon name={icon} size={15} color={color} />
      <T v="labelMedium" color={color} style={{ marginLeft: 4 }}>
        {value}
      </T>
    </View>
  );
}
