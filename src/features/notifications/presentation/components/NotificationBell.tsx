import { useNavigation } from "@react-navigation/native";
import React from "react";
import { View } from "react-native";
import { Badge, IconButton } from "react-native-paper";

import { useNotificationCenter } from "../context/NotificationCenter";

// La campana con el número de avisos sin leer (`notification_bell.dart`).
export function NotificationBell({ color }: { color?: string }) {
  const navigation = useNavigation();
  const center = useNotificationCenter();
  const count = center.unreadCount;
  return (
    <View>
      <IconButton
        testID="notification-bell"
        accessibilityLabel="Notificaciones"
        icon="bell-outline"
        iconColor={color}
        size={22}
        style={{ margin: 0 }}
        onPress={() => navigation.navigate("Notifications")}
      />
      {count > 0 && (
        <Badge size={16} style={{ position: "absolute", top: 4, right: 4 }}>
          {count > 9 ? "9+" : count}
        </Badge>
      )}
    </View>
  );
}
