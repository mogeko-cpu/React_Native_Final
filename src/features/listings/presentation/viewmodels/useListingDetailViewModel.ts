import { useCallback, useEffect, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { useErrorState } from "@/src/core/hooks/useErrorState";
import { TOKENS } from "@/src/core/di/tokens";
import { projectLink, Sharer, ShareResult } from "@/src/core/platform/Sharer";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { memberIdsOf } from "@/src/features/groups/domain/entities/Group";
import { GroupRepository } from "@/src/features/groups/domain/repositories/GroupRepository";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { DirectoryUser } from "@/src/features/users/domain/entities/DirectoryUser";
import { UserRepository } from "@/src/features/users/domain/repositories/UserRepository";
import { JoinRequest } from "../../domain/entities/JoinRequest";
import {
  belongsToGroup,
  canWorkTasks,
  hasMentor,
  isRecruiting,
  Listing,
  ListingMember,
  ListingRole,
  roleLabel,
  roleOf,
  teamOf,
} from "../../domain/entities/Listing";
import { ListingComment } from "../../domain/entities/ListingComment";
import { applyReaction, emptyStats, ListingStats, ReactionType } from "../../domain/entities/ListingStats";
import { TaskProgress } from "../../domain/entities/ListingTask";
import { MentorshipRequest } from "../../domain/entities/MentorshipRequest";
import { EngagementRepository } from "../../domain/repositories/EngagementRepository";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { MentorshipRepository } from "../../domain/repositories/MentorshipRepository";
import { ProjectFileRepository } from "../../domain/repositories/ProjectFileRepository";
import { SavedListingRepository } from "../../domain/repositories/SavedListingRepository";
import { TaskRepository } from "../../domain/repositories/TaskRepository";

// El detalle de un proyecto (`listing_detail_view_model.dart`): unirse,
// valorar, comentar, gestionar el equipo, el espacio del equipo y la mentoría.
export function useListingDetailViewModel(listingId: string) {
  const repository = useInject<ListingRepository>(TOKENS.ListingRepo);
  const engagement = useInject<EngagementRepository>(TOKENS.EngagementRepo);
  const groups = useInject<GroupRepository>(TOKENS.GroupRepo);
  const notifier = useInject<NotificationPublisher>(TOKENS.NotificationPublisher);
  const tasks = useInject<TaskRepository>(TOKENS.TaskRepo);
  const files = useInject<ProjectFileRepository>(TOKENS.ProjectFileRepo);
  const mentorships = useInject<MentorshipRepository>(TOKENS.MentorshipRepo);
  const users = useInject<UserRepository>(TOKENS.UserRepo);
  const saved = useInject<SavedListingRepository>(TOKENS.SavedListingRepo);
  const sharer = useInject<Sharer>(TOKENS.Sharer);
  const user = useCurrentUser();

  const [listing, setListing] = useState<Listing | null>(null);
  const [myRequest, setMyRequest] = useState<JoinRequest | null>(null);
  const [stats, setStats] = useState<ListingStats>(emptyStats);
  const [comments, setComments] = useState<ListingComment[]>([]);
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [mentorshipRequest, setMentorshipRequest] = useState<MentorshipRequest | null>(null);
  const [isSaved, setSaved] = useState(false);
  const [isLoading, setLoading] = useState(true);
  // Sube con cada carga, para que la bandeja de solicitudes también recargue.
  const [revision, setRevision] = useState(0);
  const [isWorking, setWorking] = useState(false);
  const [error, setError, lastError] = useErrorState();
  const viewRegistered = useRef(false);
  const working = useRef(false);
  const listingRef = useRef<Listing | null>(null);
  useEffect(() => {
    listingRef.current = listing;
  }, [listing]);

  const loadProgress = useCallback(async () => {
    try {
      setProgress(await tasks.progressOf(listingId));
    } catch {
      setProgress(null);
    }
  }, [tasks, listingId]);

  const loadTeamSpace = useCallback(
    async (found: Listing) => {
      if (roleOf(found, user.id) != null) {
        try {
          setFileCount((await files.getFiles(listingId)).length);
        } catch {
          setFileCount(null);
        }
      }
      try {
        setMentorshipRequest(await mentorships.getPendingFor(listingId));
      } catch {
        setMentorshipRequest(null);
      }
    },
    [files, mentorships, listingId, user.id],
  );

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const found = await repository.getListingById(listingId);
        if (!found) {
          setListing(null);
          setError("Proyecto no encontrado");
          return;
        }
        setListing(found);
        // Una vista por persona, registrada una vez por visita.
        if (!viewRegistered.current) {
          viewRegistered.current = true;
          await engagement.registerView({ listingId: found.id, groupId: found.groupId, userId: user.id }).catch(() => undefined);
        }
        // Lo demás no depende entre sí: se pide a la vez y la pantalla aparece antes.
        const [request, counters, savedIds, list] = await Promise.all([
          repository.getMyRequestForListing(listingId, user.id),
          engagement.getStatsFor(listingId, user.id),
          // Si la tabla de guardados aún no existe, el resto del detalle sirve igual.
          saved.getSavedIds(user.id).catch(() => [] as string[]),
          engagement.getComments(listingId),
        ]);
        setMyRequest(request);
        setStats(counters);
        setSaved(savedIds.includes(listingId));
        setComments(list);
        await loadProgress();
        await loadTeamSpace(found);
        setRevision((r) => r + 1);
      } catch (e) {
        setError(messageOf(e, "No se pudo cargar el proyecto"));
      } finally {
        setLoading(false);
      }
    },
    [repository, engagement, saved, listingId, user.id, loadProgress, loadTeamSpace, setError],
  );

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // ── Quién soy en este proyecto ────────────────────────────

  const myRole: ListingRole | null = listing ? roleOf(listing, user.id) : null;
  const isLeader = myRole === "leader";
  const isCreator = listing?.creatorId === user.id;
  const isMember = listing?.memberIds.includes(user.id) ?? false;
  const team: ListingMember[] = listing ? teamOf(listing) : [];
  const canRequestToJoin = listing != null && !isCreator && !isMember && isRecruiting(listing) && myRequest == null;
  const isInvitedMentor = myRole == null && mentorshipRequest?.mentorId === user.id;
  const canRequestMentorship = canWorkTasks(myRole) && !(listing ? hasMentor(listing) : true) && mentorshipRequest == null;
  const canCancelMentorship = mentorshipRequest != null && (mentorshipRequest.requesterId === user.id || isLeader);

  // Una escritura sobre el equipo: una a la vez, y después se relee el proyecto.
  const teamWrite = async (action: () => Promise<void>, fallback: string): Promise<boolean> => {
    if (working.current) return false;
    working.current = true;
    setWorking(true);
    setError(null);
    try {
      await action();
      setListing(await repository.getListingById(listingId));
      return true;
    } catch (e) {
      setError(messageOf(e, fallback));
      return false;
    } finally {
      working.current = false;
      setWorking(false);
    }
  };

  const freeTasksOf = async (userId: string) => {
    await tasks.unassignAll({ listingId, userId }).catch(() => undefined);
  };

  // ── Valorar y comentar ────────────────────────────────────

  // Optimista: el contador cambia en el mismo toque y Roble se entera después.
  // Las escrituras van en fila, cada una con el voto que había antes de ese
  // toque. Si una falla, se vuelve a leer lo que Roble tiene de verdad.
  const reacting = useRef<Promise<void>>(Promise.resolve());
  const statsRef = useRef(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const react = (reaction: ReactionType) => {
    const current = listingRef.current;
    if (!current) return;
    const before = statsRef.current;
    const after = applyReaction(before, reaction);
    statsRef.current = after;
    setStats(after);
    setError(null);
    reacting.current = reacting.current.then(async () => {
      try {
        await engagement.toggleReaction({ listingId: current.id, groupId: current.groupId, userId: user.id, reaction, current: before.myReaction });
      } catch (e) {
        const actual = await engagement.getStatsFor(current.id, user.id).catch(() => before);
        statsRef.current = actual;
        setStats(actual);
        setError(messageOf(e, "No se pudo registrar tu valoración"));
      }
    });
  };

  const comment = async (body: string): Promise<boolean> => {
    const current = listingRef.current;
    if (!current || working.current) return false;
    working.current = true;
    setWorking(true);
    setError(null);
    try {
      const stored = await engagement.addComment({ listingId: current.id, groupId: current.groupId, authorId: user.id, authorName: user.name, body });
      setComments((list) => [stored, ...list]);
      setStats((s) => ({ ...s, comments: s.comments + 1 }));
      await notifyComment(current, body);
      return true;
    } catch (e) {
      setError(messageOf(e, "No se pudo publicar tu comentario"));
      return false;
    } finally {
      working.current = false;
      setWorking(false);
    }
  };

  // El creador, el equipo y el grupo que lo publicó, menos quien comentó.
  const notifyComment = async (current: Listing, body: string) => {
    const recipients = new Set<string>([current.creatorId, ...current.memberIds]);
    if (belongsToGroup(current)) {
      try {
        const group = await groups.getGroupById(current.groupId);
        if (group) memberIdsOf(group).forEach((id) => recipients.add(id));
      } catch {
        // Se avisa a quien se pueda.
      }
    }
    await notifier.commentAdded({ listingId: current.id, listingTitle: current.title, authorId: user.id, authorName: user.name, comment: body, recipientIds: recipients });
  };

  const canDeleteComment = (c: ListingComment) => c.authorId === user.id;

  const deleteComment = async (commentId: string) => {
    if (working.current) return;
    working.current = true;
    setWorking(true);
    setError(null);
    try {
      await engagement.deleteComment(commentId);
      setComments((list) => list.filter((c) => c.id !== commentId));
      setStats((s) => ({ ...s, comments: Math.max(0, s.comments - 1) }));
    } catch (e) {
      setError(messageOf(e, "No se pudo eliminar el comentario"));
    } finally {
      working.current = false;
      setWorking(false);
    }
  };

  // ── Guardar y compartir ───────────────────────────────────

  // También optimista: el marcador cambia al tocar.
  const toggleSaved = async (): Promise<boolean | null> => {
    const next = !isSaved;
    setSaved(next);
    setError(null);
    try {
      if (next) await saved.save(user.id, listingId);
      else await saved.unsave(user.id, listingId);
      return next;
    } catch (e) {
      setSaved(!next);
      setError(messageOf(e, next ? "No se pudo guardar el proyecto" : "No se pudo quitar de guardados"));
      return null;
    }
  };

  const share = async (): Promise<ShareResult | null> => {
    const current = listingRef.current;
    if (!current) return null;
    try {
      return await sharer.share({
        title: current.title,
        message: `Mira «${current.title}» en Campus Innovate: ${current.description.length > 120 ? `${current.description.slice(0, 117)}…` : current.description}`,
        url: projectLink(current.id),
      });
    } catch (e) {
      setError(messageOf(e, "No se pudo compartir el proyecto"));
      return null;
    }
  };

  // ── Eliminar el proyecto ──────────────────────────────────

  // Sin cascadas: primero todo lo que cuelga del proyecto, después el proyecto.
  const deleteListing = async (): Promise<boolean> => {
    if (!isLeader) {
      setError("Solo el líder del proyecto puede eliminarlo.");
      return false;
    }
    if (working.current) return false;
    working.current = true;
    setWorking(true);
    setError(null);
    try {
      await engagement.purgeListing(listingId);
      await tasks.purgeListing(listingId);
      await files.purgeListing(listingId, user.id);
      await mentorships.purgeListing(listingId);
      await repository.deleteListing(listingId);
      return true;
    } catch (e) {
      setError(messageOf(e, "No se pudo eliminar el proyecto"));
      return false;
    } finally {
      working.current = false;
      setWorking(false);
    }
  };

  // ── Equipo ────────────────────────────────────────────────

  const removeMember = async (member: ListingMember) => {
    const current = listingRef.current;
    if (!current) return false;
    const done = await teamWrite(() => repository.removeMember({ listingId, userId: member.userId, actorId: user.id }), "No se pudo quitar a la persona del equipo");
    if (done) {
      await freeTasksOf(member.userId);
      await notifier.memberRemoved({ listingId: current.id, listingTitle: current.title, deciderId: user.id, userId: member.userId });
    }
    return done;
  };

  const leave = async () => {
    const done = await teamWrite(() => repository.leaveListing({ listingId, userId: user.id }), "No se pudo salir del proyecto");
    if (done) await freeTasksOf(user.id);
    return done;
  };

  const setRole = async (member: ListingMember, role: ListingRole) => {
    const current = listingRef.current;
    if (!current || member.role === role) return false;
    const done = await teamWrite(() => repository.setMemberRole({ listingId, userId: member.userId, role, actorId: user.id }), "No se pudo cambiar el rol");
    if (done) {
      await notifier.roleChanged({ listingId: current.id, listingTitle: current.title, deciderId: user.id, userId: member.userId, roleLabel: roleLabel(role), isLeadership: false });
    }
    return done;
  };

  const transferLeadership = async (member: ListingMember) => {
    const current = listingRef.current;
    if (!current) return false;
    const done = await teamWrite(() => repository.transferLeadership({ listingId, newLeaderId: member.userId, actorId: user.id }), "No se pudo transferir el liderazgo");
    if (done) {
      await notifier.roleChanged({ listingId: current.id, listingTitle: current.title, deciderId: user.id, userId: member.userId, roleLabel: roleLabel("leader"), isLeadership: true });
    }
    return done;
  };

  // ── Mentoría ──────────────────────────────────────────────

  // Cualquiera del directorio que no esté ya en el equipo.
  const mentorCandidates = async (): Promise<DirectoryUser[]> => {
    const current = listingRef.current;
    if (!current) return [];
    return (await users.getUsers()).filter((u) => roleOf(current, u.id) == null);
  };

  const requestMentorship = async (mentor: DirectoryUser, message: string) => {
    const current = listingRef.current;
    if (!current) return false;
    let stored: MentorshipRequest | null = null;
    const done = await teamWrite(async () => {
      stored = await mentorships.request({
        listingId: current.id,
        listingTitle: current.title,
        requesterId: user.id,
        requesterName: user.name,
        mentorId: mentor.id,
        mentorName: mentor.name,
        message,
      });
      setMentorshipRequest(stored);
    }, "No se pudo enviar la solicitud de mentoría");
    if (done && stored) {
      await notifier.mentorshipRequested({ listingId: current.id, listingTitle: current.title, requesterId: user.id, requesterName: user.name, mentorId: (stored as MentorshipRequest).mentorId });
    }
    return done;
  };

  const cancelMentorshipRequest = async () => {
    const request = mentorshipRequest;
    if (!request) return false;
    return teamWrite(async () => {
      await mentorships.cancel({ requestId: request.id, actorId: user.id });
      setMentorshipRequest(null);
    }, "No se pudo cancelar la solicitud");
  };

  const acceptMentorship = async () => {
    const request = mentorshipRequest;
    if (!request) return false;
    const done = await teamWrite(async () => {
      await mentorships.accept({ requestId: request.id, actorId: user.id });
      setMentorshipRequest(null);
    }, "No se pudo aceptar la mentoría");
    if (!done) return false;
    const joined = await repository.getListingById(listingId).catch(() => null);
    if (joined) {
      await loadProgress();
      await loadTeamSpace(joined);
    }
    await notifier.mentorshipResolved({
      accepted: true,
      listingId: request.listingId,
      listingTitle: request.listingTitle,
      mentorId: user.id,
      mentorName: user.name,
      recipientIds: joined?.memberIds ?? [request.requesterId],
    });
    return true;
  };

  const rejectMentorship = async () => {
    const request = mentorshipRequest;
    if (!request) return false;
    const done = await teamWrite(async () => {
      await mentorships.reject({ requestId: request.id, actorId: user.id });
      setMentorshipRequest(null);
    }, "No se pudo rechazar la mentoría");
    if (done) {
      await notifier.mentorshipResolved({
        accepted: false,
        listingId: request.listingId,
        listingTitle: request.listingTitle,
        mentorId: user.id,
        mentorName: user.name,
        recipientIds: [request.requesterId],
      });
    }
    return done;
  };

  return {
    currentUserId: user.id,
    listing,
    myRequest,
    stats,
    comments,
    progress,
    fileCount,
    mentorshipRequest,
    isLoading,
    revision,
    isWorking,
    error,
    lastError,
    load,
    myRole,
    isLeader,
    isCreator,
    isMember,
    team,
    canRequestToJoin,
    isInvitedMentor,
    canRequestMentorship,
    canCancelMentorship,
    react,
    isSaved,
    toggleSaved,
    share,
    comment,
    canDeleteComment,
    deleteComment,
    deleteListing,
    removeMember,
    leave,
    setRole,
    transferLeadership,
    mentorCandidates,
    requestMentorship,
    cancelMentorshipRequest,
    acceptMentorship,
    rejectMentorship,
  };
}
