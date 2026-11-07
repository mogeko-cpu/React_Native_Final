import { useCallback, useEffect, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { usePoller } from "@/src/core/hooks/usePoller";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { belongsToGroup } from "@/src/features/listings/domain/entities/Listing";
import { ListingRepository } from "@/src/features/listings/domain/repositories/ListingRepository";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { Group, GroupInvitation, GroupRequest, hasMember, isOwner } from "../../domain/entities/Group";
import { GroupRepository } from "../../domain/repositories/GroupRepository";

// La pestaña Grupos (`groups_view_model.dart`): los míos, los demás, las
// invitaciones que me llegaron. Se vuelve a leer sola cada 20 segundos.
export function useGroupsViewModel() {
  const groups = useInject<GroupRepository>(TOKENS.GroupRepo);
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const notifier = useInject<NotificationPublisher>(TOKENS.NotificationPublisher);
  const user = useCurrentUser();

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [otherGroups, setOtherGroups] = useState<Group[]>([]);
  const [projectCounts, setCounts] = useState<Record<string, number>>({});
  const [myRequests, setMyRequests] = useState<GroupRequest[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isWorking, setWorking] = useState(false);
  const working = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const lastActionError = useRef<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const all = await groups.getGroups();
        const requests = await groups.getMyRequests(user.id);
        const received = await groups.getMyInvitations(user.id);
        const counts: Record<string, number> = {};
        for (const listing of await listings.getListings()) {
          if (!belongsToGroup(listing)) continue;
          counts[listing.groupId] = (counts[listing.groupId] ?? 0) + 1;
        }
        const inside = (g: Group) => isOwner(g, user.id) || hasMember(g, user.id);
        setMyGroups(all.filter(inside));
        setOtherGroups(all.filter((g) => !inside(g)));
        setCounts(counts);
        setMyRequests(requests);
        setInvitations(received);
        if (!silent) setError(null);
      } catch (e) {
        if (!silent) setError(messageOf(e, "No se pudieron cargar los grupos"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [groups, listings, user.id],
  );

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  usePoller(async () => {
    if (working.current || isLoading) return;
    await load(true);
  }, 20_000);

  const answer = async (invitation: GroupInvitation, accepted: boolean): Promise<boolean> => {
    if (working.current) return false;
    working.current = true;
    setWorking(true);
    lastActionError.current = null;
    try {
      if (accepted) await groups.acceptInvitation(invitation.id);
      else await groups.rejectInvitation(invitation.id);
      await notifier.invitationResolved({
        accepted,
        groupId: invitation.groupId,
        groupName: invitation.groupName,
        inviteeId: invitation.inviteeId,
        inviteeName: invitation.inviteeName,
        inviterId: invitation.inviterId,
      });
      await load(true);
      return true;
    } catch (e) {
      lastActionError.current = messageOf(e, "No se pudo responder la invitación");
      return false;
    } finally {
      working.current = false;
      setWorking(false);
    }
  };

  return {
    currentUserId: user.id,
    myGroups,
    otherGroups,
    invitations,
    isLoading,
    isWorking,
    error,
    lastActionError: () => lastActionError.current,
    load,
    projectsOf: (group: Group) => projectCounts[group.id] ?? 0,
    myRequestFor: (group: Group) => myRequests.find((r) => r.groupId === group.id) ?? null,
    acceptInvitation: (invitation: GroupInvitation) => answer(invitation, true),
    rejectInvitation: (invitation: GroupInvitation) => answer(invitation, false),
  };
}
