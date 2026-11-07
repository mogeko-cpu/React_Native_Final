import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";

import { AppButton } from "@/src/core/components/Buttons";
import { Icon } from "@/src/core/components/Icon";
import { T } from "@/src/core/components/T";
import { IconName } from "@/src/core/ui/icons";
import { useAppTheme } from "@/src/theme/theme";
import { ListingStats, ReactionType } from "../../domain/entities/ListingStats";

// Valorar un proyecto (`reaction_bar.dart`): me gusta / no me gusta, con un
// pequeño salto al elegir, y las vistas y comentarios al lado.
export function ReactionBar({ stats, onReact, isBusy }: { stats: ListingStats; onReact: (reaction: ReactionType) => void; isBusy?: boolean }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      <ReactionButton
        testID="react-like"
        icon="thumb-up-outline"
        selectedIcon="thumb-up"
        count={stats.likes}
        selected={stats.myReaction === "like"}
        onPress={isBusy ? undefined : () => onReact("like")}
      />
      <ReactionButton
        testID="react-dislike"
        icon="thumb-down-outline"
        selectedIcon="thumb-down"
        count={stats.dislikes}
        selected={stats.myReaction === "dislike"}
        onPress={isBusy ? undefined : () => onReact("dislike")}
      />
      <Passive icon="eye-outline" label={stats.views === 1 ? "1 vista" : `${stats.views} vistas`} color={theme.colors.onSurfaceVariant} />
      <Passive icon="comment-outline" label={stats.comments === 1 ? "1 comentario" : `${stats.comments} comentarios`} color={theme.colors.onSurfaceVariant} />
    </View>
  );
}

function ReactionButton({ icon, selectedIcon, count, selected, onPress, testID }: { icon: IconName; selectedIcon: IconName; count: number; selected: boolean; onPress?: () => void; testID: string }) {
  const theme = useAppTheme();
  const [scale] = useState(() => new Animated.Value(1));
  const was = useRef(selected);
  useEffect(() => {
    if (selected && !was.current) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.18, duration: 115, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 145, useNativeDriver: true }),
      ]).start();
    }
    was.current = selected;
  }, [selected, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <AppButton
        testID={testID}
        mode={selected ? "tonal" : "outlined"}
        icon={selected ? selectedIcon : icon}
        textColor={selected ? undefined : theme.colors.onSurfaceVariant}
        disabled={!onPress}
        onPress={onPress}
      >
        {String(count)}
      </AppButton>
    </Animated.View>
  );
}

function Passive({ icon, label, color }: { icon: IconName; label: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Icon name={icon} size={16} color={color} />
      <T v="bodySmall" color={color} style={{ marginLeft: 5 }}>
        {label}
      </T>
    </View>
  );
}
