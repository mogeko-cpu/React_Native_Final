import { useCallback, useEffect, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { useErrorState } from "@/src/core/hooks/useErrorState";
import { TOKENS } from "@/src/core/di/tokens";
import { usePoller } from "@/src/core/hooks/usePoller";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { Listing } from "@/src/features/listings/domain/entities/Listing";
import { ListingRepository } from "@/src/features/listings/domain/repositories/ListingRepository";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { Group, GroupInvitation, GroupRequest, hasMember, isOwner, isPending } from "../../domain/entities/Group";
import { GroupRepository } from "../../domain/repositories/GroupRepository";

// El detalle de un grupo (`group_detail_view_model.dart`). Se vuelve a leer
// solo cada 15 segundos mientras está a la vista.
export function useGroupDetailViewModel(groupId: string) {
  const groups = useInject<GroupRepository>(TOKENS.GroupRepo);
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const notifier = useInject<NotificationPublisher>(TOKENS.NotificationPublisher);
  const user = useCurrentUser();

  const [group, setGroup] = useState<Group | null>(null);
  const [requests, setRequests] = useState<GroupRequest[]>([]);
  const [projects, setProjects] = useState<Listing[]>([]);
  const [myRequest, setMyRequest] = useState<GroupRequest | null>(null);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [myInvitation, setMyInvitation] = useState<GroupInvitation | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isWorking, setWorking] = useState(false);
  const working = useRef(false);
  const [error, setError, lastError] = useErrorState();

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const found = await groups.getGroupById(groupId);
        if (!found) {
          setError("Grupo no encontrado");
          setGroup(null);
          return;
        }
        setGroup(found);
        setProjects(await listings.getListingsByGroup(groupId));
        const inside = isOwner(found, user.id) || hasMember(found, user.id);
        if (isOwner(found, user.id)) {
          setRequests(await groups.getRequestsForGroup(groupId));
          setMyRequest(null);
        } else {
          setRequests([]);
          setMyRequest(inside ? null : await groups.getMyRequestForGroup(groupId, user.id));
        }
        if (inside) {
          setInvitations(await groups.getInvitationsForGroup(groupId));
          setMyInvitation(null);
        } else {
          setInvitations([]);
          setMyInvitation((await groups.getMyInvitations(user.id)).find((i) => i.groupId === groupId) ?? null);
        }
      } catch (e) {
        if (!silent) setError(messageOf(e, "No se pudo cargar el grupo"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [groups, listings, groupId, user.id, setError],
  );

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  usePoller(async () => {
    if (working.current || isLoading) return;
    await load(true);
  }, 15_000);

  const amOwner = group ? isOwner(group, user.id) : false;
  const amMember = group ? hasMember(group, user.id) : false;
  const isInside = amOwner || amMember;

  const write = async (action: () => Promise<unknown>, fallback: string, reload = true): Promise<boolean> => {
    if (working.current) return false;
    working.current = true;
    setWorking(true);
    setError(null);
    try {
      await action();
      if (reload) await load(true);
      return true;
    } catch (e) {
      setError(messageOf(e, fallback));
      return false;
    } finally {
      working.current = false;
      setWorking(false);
    }
  };

  const requestToJoin = async (message: string) => {
    const current = group;
    if (!current) return false;
    const sent = await write(
      () => groups.requestToJoin({ groupId: current.id, applicantId: user.id, applicantName: user.name, message: message.trim() }),
      "No se pudo enviar la solicitud",
    );
    if (sent) {
      await notifier.joinRequestReceived({
        target: "group",
        targetId: current.id,
        targetName: current.name,
        applicantId: user.id,
        applicantName: user.name,
        recipientId: current.ownerId,
      });
    }
    return sent;
  };

  const resolveRequest = async (requestId: string, accepted: boolean) => {
    const current = group;
    const request = requests.find((r) => r.id === requestId);
    const done = await write(
      () => (accepted ? groups.acceptRequest(requestId) : groups.rejectRequest(requestId)),
      accepted ? "No se pudo aceptar la solicitud" : "No se pudo rechazar la solicitud",
    );
    if (done && current && request) {
      await notifier.requestResolved({ accepted, target: "group", targetId: current.id, targetName: current.name, deciderId: user.id, applicantId: request.applicantId });
    }
    return done;
  };

  const answerMyInvitation = async (accepted: boolean) => {
    const invitation = myInvitation;
    if (!invitation) return false;
    const done = await write(
      () => (accepted ? groups.acceptInvitation(invitation.id) : groups.rejectInvitation(invitation.id)),
      accepted ? "No se pudo aceptar la invitación" : "No se pudo rechazar la invitación",
    );
    if (done) {
      await notifier.invitationResolved({
        accepted,
        groupId: invitation.groupId,
        groupName: invitation.groupName,
        inviteeId: invitation.inviteeId,
        inviteeName: invitation.inviteeName,
        inviterId: invitation.inviterId,
      });
    }
    return done;
  };

  // Eliminar un grupo no elimina sus proyectos: se niega mientras tenga alguno.
  const deleteGroup = async () => {
    if (!amOwner) {
      setError("Solo quien creó el grupo puede eliminarlo.");
      return false;
    }
    if (projects.length > 0) {
      const count = projects.length;
      setError(
        count === 1
          ? "Este grupo tiene 1 proyecto publicado. Elimínalo antes de eliminar el grupo."
          : `Este grupo tiene ${count} proyectos publicados. Elimínalos antes de eliminar el grupo.`,
      );
      return false;
    }
    return write(() => groups.deleteGroup(groupId), "No se pudo eliminar el grupo", false);
  };

  return {
    group,
    requests,
    projects,
    myRequest,
    invitations,
    myInvitation,
    isLoading,
    isWorking,
    error,
    lastError,
    load,
    isOwner: amOwner,
    isMember: amMember,
    isInside,
    canRequestToJoin: group != null && !isInside && myRequest == null && myInvitation == null,
    pendingRequests: requests.filter(isPending),
    canCancel: (invitation: GroupInvitation) => amOwner || invitation.inviterId === user.id,
    requestToJoin,
    accept: (requestId: string) => resolveRequest(requestId, true),
    reject: (requestId: string) => resolveRequest(requestId, false),
    removeMember: (userId: string) => write(() => groups.removeMember({ groupId, userId }), "No se pudo quitar al integrante"),
    leave: () => write(() => groups.removeMember({ groupId, userId: user.id }), "No se pudo quitar al integrante"),
    acceptMyInvitation: () => answerMyInvitation(true),
    rejectMyInvitation: () => answerMyInvitation(false),
    cancelInvitation: (invitationId: string) => write(() => groups.cancelInvitation(invitationId), "No se pudo cancelar la invitación"),
    deleteGroup,
  };
}
