import { useCallback, useEffect, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { usePoller } from "@/src/core/hooks/usePoller";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { Group, GroupMessage } from "../../domain/entities/Group";
import { GroupChatRepository } from "../../domain/repositories/GroupChatRepository";
import { GroupRepository } from "../../domain/repositories/GroupRepository";

// El chat de un grupo (`group_chat_view_model.dart`). ROBLE no tiene canal de
// empuje: mientras la pantalla está abierta se vuelve a leer cada 5 segundos.
export function useGroupChatViewModel(groupId: string) {
  const chat = useInject<GroupChatRepository>(TOKENS.GroupChatRepo);
  const groups = useInject<GroupRepository>(TOKENS.GroupRepo);
  const user = useCurrentUser();

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isSending, setSending] = useState(false);
  const sending = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const lastSendError = useRef<string | null>(null);
  const messagesRef = useRef<GroupMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await groups.getGroupById(groupId);
      if (!found) {
        setError("Este grupo ya no existe.");
        return;
      }
      setGroup(found);
      setMessages(await chat.getMessages({ groupId, userId: user.id }));
    } catch (e) {
      setError(messageOf(e, "No se pudo abrir el chat"));
    } finally {
      setLoading(false);
    }
  }, [chat, groups, groupId, user.id]);

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Solo se reemplaza la lista si llegó algo distinto.
  const refreshMessages = async () => {
    if (sending.current || isLoading || !group) return;
    const fetched = await chat.getMessages({ groupId, userId: user.id });
    const current = messagesRef.current;
    const changed = fetched.length !== current.length || (fetched.length > 0 && current.length > 0 && fetched[fetched.length - 1].id !== current[current.length - 1].id);
    if (changed) setMessages(fetched);
  };

  usePoller(refreshMessages, 5_000, group != null);

  const send = async (body: string): Promise<boolean> => {
    if (sending.current) return false;
    sending.current = true;
    setSending(true);
    lastSendError.current = null;
    try {
      const stored = await chat.send({ groupId, senderId: user.id, senderName: user.name, body });
      setMessages((list) => [...list, stored]);
      return true;
    } catch (e) {
      lastSendError.current = messageOf(e, "No se pudo enviar el mensaje");
      return false;
    } finally {
      sending.current = false;
      setSending(false);
    }
  };

  return { currentUserId: user.id, group, messages, isLoading, isSending, error, lastSendError: () => lastSendError.current, send };
}
