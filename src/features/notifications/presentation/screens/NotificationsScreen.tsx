import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { IconButton } from "react-native-paper";

import { EmptyState } from "@/src/core/components/EmptyState";
import { Icon } from "@/src/core/components/Icon";
import { Screen } from "@/src/core/components/Screen";
import { Card } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { IconName } from "@/src/core/ui/icons";
import { timeAgo } from "@/src/core/utils/formatters";
import { alpha, AppTheme, brand, useAppTheme } from "@/src/theme/theme";
import { AppNotification, NotificationType } from "../../domain/entities/AppNotification";
import { useNotificationCenter } from "../context/NotificationCenter";

// La bandeja (`notifications_page.dart`). Tocar un aviso lo marca leído y abre
// el proyecto o el grupo del que habla.
export default function NotificationsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const center = useNotificationCenter();
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          testID="mark-all-read"
          accessibilityLabel="Marcar todas como leídas"
          icon="check-all"
          iconColor={theme.colors.onAppBar}
          disabled={center.unreadCount === 0}
          onPress={center.markAllRead}
        />
      ),
    });
  }, [navigation, center.unreadCount, center.markAllRead, theme]);

  const open = async (notification: AppNotification) => {
    await center.markRead(notification);
    if (notification.target === "listing") navigation.navigate("ListingDetail", { listingId: notification.targetId });
    else if (notification.target === "group") navigation.navigate("GroupDetail", { groupId: notification.targetId });
  };

  const refresh = async () => {
    setRefreshing(true);
    await center.refresh();
    setRefreshing(false);
  };

  if (center.notifications.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="bell-outline"
          title="Todavía no tienes notificaciones"
          message="Te avisaremos cuando comenten tus proyectos, respondan tus solicitudes o te inviten a un grupo."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={center.notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 12, paddingTop: 8, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.colors.primary]} />}
        renderItem={({ item }) => <NotificationTile notification={item} onPress={() => open(item)} />}
      />
    </Screen>
  );
}

function NotificationTile({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  const theme = useAppTheme();
  const style = styleOf(notification.type, theme);
  const unread = !notification.isRead;
  return (
    <Card onPress={onPress} radius={18} style={{ marginBottom: 0 }} color={unread ? alpha(theme.colors.primaryContainer, theme.dark ? 0.5 : 0.35) : undefined}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: alpha(style.color, 0.14),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={style.icon} size={20} color={style.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <T v="bodyLarge" w={unread ? 700 : 400} numberOfLines={1}>
            {notification.title}
          </T>
          <T v="bodyMedium" color={theme.colors.onSurfaceVariant} numberOfLines={2}>
            {notification.body}
          </T>
          <T v="labelSmall" color={theme.colors.onSurfaceVariant} style={{ marginTop: 2 }}>
            {timeAgo(notification.createdAt)}
          </T>
        </View>
        {unread && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary, marginLeft: 12 }} />}
      </View>
    </Card>
  );
}

function styleOf(type: NotificationType | null, theme: AppTheme): { icon: IconName; color: string } {
  const c = theme.colors;
  switch (type) {
    case "comment":
      return { icon: "comment-outline", color: c.primary };
    case "ideaPublished":
      return { icon: "lightbulb-outline", color: brand.orange };
    case "requestReceived":
      return { icon: "account-plus-outline", color: c.primary };
    case "requestAccepted":
    case "invitationAccepted":
      return { icon: "check-circle-outline", color: brand.green };
    case "requestRejected":
    case "invitationRejected":
    case "mentorshipRejected":
      return { icon: "close-circle-outline", color: c.error };
    case "invitationReceived":
      return { icon: "email-outline", color: c.primary };
    case "taskAssigned":
      return { icon: "checkbox-marked-circle-outline", color: c.primary };
    case "memberRemoved":
      return { icon: "account-remove-outline", color: c.error };
    case "roleChanged":
      return { icon: "account-cog-outline", color: brand.purple };
    case "mentorshipRequested":
      return { icon: "school-outline", color: c.tertiary };
    case "mentorshipAccepted":
      return { icon: "school-outline", color: brand.green };
    default:
      return { icon: "bell-outline", color: c.primary };
  }
}
