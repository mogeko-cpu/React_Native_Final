import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { DirectoryUser } from "@/src/features/users/domain/entities/DirectoryUser";
import { UserRepository } from "@/src/features/users/domain/repositories/UserRepository";
import { Group, GroupInvitation, GroupRequest, hasMember, isPending } from "../../domain/entities/Group";
import { GroupRepository } from "../../domain/repositories/GroupRepository";

// Invitar personas a un grupo (`invite_members_view_model.dart`). Solo aparecen
// quienes ya abrieron la app (el directorio `app_users`).
export function useInviteMembersViewModel(groupId: string) {
  const groups = useInject<GroupRepository>(TOKENS.GroupRepo);
  const users = useInject<UserRepository>(TOKENS.UserRepo);
  const notifier = useInject<NotificationPublisher>(TOKENS.NotificationPublisher);
  const user = useCurrentUser();

  const [group, setGroup] = useState<Group | null>(null);
  const [people, setPeople] = useState<DirectoryUser[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [requests, setRequests] = useState<GroupRequest[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const sending = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastActionError = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await groups.getGroupById(groupId);
      if (!found) {
        setError("Grupo no encontrado");
        return;
      }
      setGroup(found);
      setPeople(await users.getUsers());
      setInvitations(await groups.getInvitationsForGroup(groupId));
      setRequests(await groups.getRequestsForGroup(groupId));
    } catch (e) {
      setError(messageOf(e, "No se pudo cargar la lista de personas"));
    } finally {
      setLoading(false);
    }
  }, [groups, users, groupId]);

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const candidates = useMemo(() => {
    if (!group) return [];
    const text = query.trim().toLowerCase();
    return people.filter((p) => !hasMember(group, p.id) && (!text || p.name.toLowerCase().includes(text) || p.email.toLowerCase().includes(text)));
  }, [group, people, query]);

  const invite = async (person: DirectoryUser): Promise<boolean> => {
    const current = group;
    if (!current || sending.current != null) return false;
    sending.current = person.id;
    setSendingTo(person.id);
    lastActionError.current = null;
    try {
      await groups.inviteUser({
        groupId: current.id,
        groupName: current.name,
        inviterId: user.id,
        inviterName: user.name,
        inviteeId: person.id,
        inviteeName: person.name,
      });
      await notifier.invitationReceived({ groupId: current.id, groupName: current.name, inviterId: user.id, inviterName: user.name, inviteeId: person.id });
      setInvitations(await groups.getInvitationsForGroup(groupId));
      return true;
    } catch (e) {
      lastActionError.current = messageOf(e, "No se pudo enviar la invitación");
      return false;
    } finally {
      sending.current = null;
      setSendingTo(null);
    }
  };

  return {
    group,
    candidates,
    query,
    setQuery,
    isLoading,
    sendingTo,
    error,
    lastActionError: () => lastActionError.current,
    load,
    isInvited: (p: DirectoryUser) => invitations.some((i) => i.inviteeId === p.id),
    hasRequested: (p: DirectoryUser) => requests.some((r) => r.applicantId === p.id && isPending(r)),
    invite,
  };
}
