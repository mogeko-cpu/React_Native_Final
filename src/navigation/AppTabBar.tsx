import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/core/components/Icon";
import { T } from "@/src/core/components/T";
import { IconName } from "@/src/core/ui/icons";
import { useAppTheme } from "@/src/theme/theme";

// Lo de cada pestaña: ícono, ícono elegido y nombre.
export const TAB_ITEMS: Record<string, { icon: IconName; selectedIcon: IconName; label: string }> = {
  Home: { icon: "home-outline", selectedIcon: "home", label: "Inicio" },
  Explore: { icon: "compass-outline", selectedIcon: "compass", label: "Explorar" },
  Ranking: { icon: "podium", selectedIcon: "podium", label: "Ranking" },
  Groups: { icon: "account-group-outline", selectedIcon: "account-group", label: "Grupos" },
  Profile: { icon: "account-outline", selectedIcon: "account", label: "Perfil" },
};

// La `NavigationBar` de Material 3: la píldora `primaryContainer` detrás del
// ícono elegido, que se pinta del color principal.
export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.raised,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 12),
        borderTopWidth: 1,
        borderTopColor: theme.colors.hairline,
        shadowColor: theme.colors.cardShadow,
        shadowOpacity: 1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -2 },
        elevation: 10,
      }}
    >
      {state.routes.map((route, index) => {
        const item = TAB_ITEMS[route.name];
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.label}
            onPress={onPress}
            style={{ flex: 1, alignItems: "center" }}
          >
            <View
              style={{
                width: 64,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: focused ? theme.colors.primaryContainer : "transparent",
              }}
            >
              <Icon name={focused ? item.selectedIcon : item.icon} size={24} color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} />
            </View>
            <T v="labelMedium" w={focused ? 700 : 500} color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} style={{ marginTop: 4 }}>
              {item.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
