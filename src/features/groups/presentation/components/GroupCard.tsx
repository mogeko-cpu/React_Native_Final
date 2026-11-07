import React from "react";
import { View } from "react-native";

import { Icon } from "@/src/core/components/Icon";
import { IconAvatar } from "@/src/core/components/NameAvatar";
import { Card } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { useAppTheme } from "@/src/theme/theme";
import { Group } from "../../domain/entities/Group";

// La tarjeta de un grupo (`group_card.dart`).
export function GroupCard({ group, projectCount, badge, onPress }: { group: Group; projectCount: number; badge?: string | null; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Card onPress={onPress} testID={`group-card-${group.id}`}>
      <View style={{ padding: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <IconAvatar radius={18} color={theme.colors.primaryContainer}>
            <Icon name="account-group-outline" size={19} color={theme.colors.onPrimaryContainer} />
          </IconAvatar>
          <T v="titleMedium" w={700} numberOfLines={1} style={{ flex: 1, marginLeft: 12 }}>
            {group.name}
          </T>
          {badge != null && (
            <View style={{ marginLeft: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: theme.colors.secondaryContainer }}>
              <T v="labelSmall" w={700} color={theme.colors.onSecondaryContainer}>
                {badge}
              </T>
            </View>
          )}
        </View>
        {group.description !== "" && (
          <T color={theme.colors.onSurfaceVariant} numberOfLines={2} style={{ marginTop: 10 }}>
            {group.description}
          </T>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
          <Icon name="account-outline" size={16} color={theme.colors.outline} />
          <T v="bodySmall" numberOfLines={1} style={{ flex: 1, marginLeft: 4 }}>
            {group.ownerName}
          </T>
          <Icon name="account-multiple-outline" size={16} color={theme.colors.outline} />
          <T v="bodySmall" style={{ marginLeft: 4 }}>
            {String(group.members.length)}
          </T>
          <Icon name="briefcase-outline" size={16} color={theme.colors.outline} style={{ marginLeft: 12 }} />
          <T v="bodySmall" style={{ marginLeft: 4 }}>
            {String(projectCount)}
          </T>
        </View>
      </View>
    </Card>
  );
}
