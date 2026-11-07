import { useCallback, useEffect, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { useErrorState } from "@/src/core/hooks/useErrorState";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { Group, memberIdsOf } from "@/src/features/groups/domain/entities/Group";
import { GroupRepository } from "@/src/features/groups/domain/repositories/GroupRepository";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { draftListing, Listing } from "../../domain/entities/Listing";
import { LISTING_CATEGORIES } from "../../domain/entities/ListingCategory";
import { ListingFailure } from "../../domain/ListingFailure";
import { ListingRepository, MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "../../domain/repositories/ListingRepository";

// Publicar una idea (`create_listing_view_model.dart`). Los proyectos se
// publican a nombre de un grupo; el resto del grupo recibe un aviso.
export function useCreateListingViewModel() {
  const repository = useInject<ListingRepository>(TOKENS.ListingRepo);
  const groups = useInject<GroupRepository>(TOKENS.GroupRepo);
  const notifier = useInject<NotificationPublisher>(TOKENS.NotificationPublisher);
  const user = useCurrentUser();

  const [category, selectCategory] = useState(LISTING_CATEGORIES[0]);
  const [maxMembers, setMax] = useState(4);
  const [requiredSkills, setSkills] = useState<string[]>([]);
  const [isSaving, setSaving] = useState(false);
  const [error, setError, lastError] = useErrorState();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [selectedGroup, selectGroup] = useState<Group | null>(null);
  const [isLoadingGroups, setLoadingGroups] = useState(true);

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const mine = await groups.getMyGroups(user.id);
      setMyGroups(mine);
      // Con un solo grupo, ya queda elegido.
      selectGroup(mine.length === 1 ? mine[0] : null);
    } catch (e) {
      setError(messageOf(e, "No se pudieron cargar tus grupos"));
    } finally {
      setLoadingGroups(false);
    }
  }, [groups, user.id, setError]);

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGroups();
  }, [loadGroups]);

  const addSkill = (skill: string) => {
    const clean = skill.trim();
    if (!clean || requiredSkills.includes(clean)) return;
    setSkills([...requiredSkills, clean]);
  };

  const submit = async (title: string, description: string): Promise<Listing | null> => {
    setSaving(true);
    setError(null);
    try {
      const group = selectedGroup;
      if (!group) throw new ListingFailure("Elige el grupo que publica este proyecto.");
      const saved = await repository.createListing(
        draftListing({
          title: title.trim(),
          description: description.trim(),
          category,
          creatorId: user.id,
          creatorName: user.name,
          maxMembers,
          requiredSkills,
          groupId: group.id,
          groupName: group.name,
        }),
      );
      await notifier.ideaPublished({
        listingId: saved.id,
        listingTitle: saved.title,
        groupName: group.name,
        authorId: user.id,
        authorName: user.name,
        recipientIds: memberIdsOf(group),
      });
      return saved;
    } catch (e) {
      setError(messageOf(e, "No se pudo crear el proyecto"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  return {
    lastError,
    category,
    selectCategory,
    maxMembers,
    setMaxMembers: (value: number) => setMax(Math.min(MAX_TEAM_SIZE, Math.max(MIN_TEAM_SIZE, value))),
    requiredSkills,
    addSkill,
    removeSkill: (skill: string) => setSkills(requiredSkills.filter((s) => s !== skill)),
    isSaving,
    error,
    myGroups,
    selectedGroup,
    selectGroup,
    isLoadingGroups,
    hasNoGroups: !isLoadingGroups && myGroups.length === 0,
    loadGroups,
    submit,
  };
}
