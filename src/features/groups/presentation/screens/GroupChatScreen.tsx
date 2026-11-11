import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTextField } from "@/src/core/components/AppTextField";
import { FilledIconButton } from "@/src/core/components/Buttons";
import { EmptyState } from "@/src/core/components/EmptyState";
import { NameAvatar } from "@/src/core/components/NameAvatar";
import { Screen } from "@/src/core/components/Screen";
import { Skeleton } from "@/src/core/components/Skeleton";
import { T } from "@/src/core/components/T";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { timeOfDay } from "@/src/core/utils/formatters";
import { RootStackParamList } from "@/src/navigation/types";
import { alpha, useAppTheme } from "@/src/theme/theme";
import { GroupMessage } from "../../domain/entities/Group";
import { MAX_MESSAGE_LENGTH } from "../../domain/repositories/GroupChatRepository";
import { useGroupChatViewModel } from "../viewmodels/useGroupChatViewModel";

// El chat de un grupo (`group_chat_page.dart`).
export default function GroupChatScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { groupId } = useRoute<RouteProp<RootStackParamList, "GroupChat">>().params;
  const vm = useGroupChatViewModel(groupId);
  const snackbar = useSnackbar();
  const [input, setInput] = useState("");

  useLayoutEffect(() => {
    const name = vm.group?.name;
    navigation.setOptions({ title: name ? `Chat · ${name}` : "Chat del grupo" });
  }, [navigation, vm.group?.name]);

  // Si no se envió, el texto vuelve al campo.
  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (!(await vm.send(text))) {
      setInput(text);
      snackbar("No se envió", vm.lastSendError() ?? "Intenta de nuevo");
    }
  };

  const body = () => {
    if (vm.isLoading) return <Skeleton variant="chat" count={6} />;
    if (vm.error) return <EmptyState icon="lock-outline" title="No se pudo abrir el chat" message={vm.error} />;
    const messages = [...vm.messages].reverse();
    if (messages.length === 0) {
      return <EmptyState icon="forum-outline" title="Todavía no hay mensajes" message="Escribe el primero. Solo lo ven las personas del grupo." />;
    }
    return (
      <FlatList
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 }}
        renderItem={({ item, index }) => {
          const previous = index + 1 < messages.length ? messages[index + 1] : null;
          return <Bubble message={item} isMine={item.senderId === vm.currentUserId} showSender={previous?.senderId !== item.senderId} />;
        }}
      />
    );
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <View style={{ flex: 1 }}>{body()}</View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            paddingLeft: 12,
            paddingRight: 8,
            paddingTop: 8,
            paddingBottom: 8 + insets.bottom,
            backgroundColor: theme.colors.surface,
            elevation: 3,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: -2 },
          }}
        >
          <View style={{ flex: 1 }}>
            <AppTextField testID="chat-input" placeholder="Escribe un mensaje" multiline numberOfLines={1} maxLength={MAX_MESSAGE_LENGTH} value={input} onChangeText={setInput} />
          </View>
          <View style={{ marginLeft: 6, marginBottom: 6 }}>
            <FilledIconButton testID="chat-send" accessibilityLabel="Enviar" icon="send" onPress={send} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ message, isMine, showSender }: { message: GroupMessage; isMine: boolean; showSender: boolean }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const background = isMine ? theme.colors.primaryContainer : theme.colors.surfaceContainerHighest;
  const foreground = isMine ? theme.colors.onPrimaryContainer : theme.colors.onSurface;
  return (
    <View style={{ flexDirection: "row", justifyContent: isMine ? "flex-end" : "flex-start", alignItems: "flex-end", marginTop: showSender ? 10 : 2 }}>
      {!isMine && <View style={{ width: 30, marginRight: 6 }}>{showSender && <NameAvatar name={message.senderName} radius={14} />}</View>}
      <View style={{ maxWidth: width * 0.75, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: background }}>
        {!isMine && showSender && (
          <T v="labelSmall" w={700} color={theme.colors.primary} style={{ marginBottom: 2 }}>
            {message.senderName}
          </T>
        )}
        <T color={foreground}>{message.body}</T>
        <T v="labelSmall" color={alpha(foreground.startsWith("#") ? foreground : "#000000", 0.6)} style={{ alignSelf: "flex-end", marginTop: 2 }}>
          {timeOfDay(message.createdAt)}
        </T>
      </View>
    </View>
  );
}
