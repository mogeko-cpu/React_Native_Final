import { useCallback, useEffect, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { initialsOf } from "@/src/core/utils/formatters";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { Group } from "@/src/features/groups/domain/entities/Group";
import { GroupRepository } from "@/src/features/groups/domain/repositories/GroupRepository";
import { JoinRequest } from "@/src/features/listings/domain/entities/JoinRequest";
import { Listing } from "@/src/features/listings/domain/entities/Listing";
import { EngagementRepository } from "@/src/features/listings/domain/repositories/EngagementRepository";
import { ListingRepository } from "@/src/features/listings/domain/repositories/ListingRepository";
import { SavedListingRepository } from "@/src/features/listings/domain/repositories/SavedListingRepository";
import { UserRepository } from "@/src/features/users/domain/repositories/UserRepository";
import { cleanSkill, sameSkill, skillKey } from "@/src/features/users/domain/skills";

// El perfil (`profile_view_model.dart`): quién soy, mis cifras, mis
// habilidades, lo que guardé, mis grupos, lo que publiqué, en lo que participo
// y mis solicitudes.
export function useProfileViewModel() {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const groups = useInject<GroupRepository>(TOKENS.GroupRepo);
  const engagement = useInject<EngagementRepository>(TOKENS.EngagementRepo);
  const users = useInject<UserRepository>(TOKENS.UserRepo);
  const savedRepo = useInject<SavedListingRepository>(TOKENS.SavedListingRepo);
  const user = useCurrentUser();

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [joinedListings, setJoined] = useState<Listing[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [likesReceived, setLikes] = useState(0);
  const [viewsReceived, setViews] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  // Las habilidades que más piden los proyectos, para sugerirlas.
  const [popularSkills, setPopular] = useState<string[]>([]);
  const [saved, setSaved] = useState<Listing[]>([]);
  // Si las tablas nuevas no existen todavía, el resto del perfil sirve igual.
  const [extrasError, setExtrasError] = useState<string | null>(null);
  const [skillError, setSkillError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        // Una sola lectura de proyectos para todo el perfil (las mismas reglas
        // de `getMyListings` y `getJoinedListings`): cada petición cuenta
        // contra el límite por minuto de Roble.
        const all = await listings.getListings();
        const mine = all.filter((l) => l.creatorId === user.id);
        const joined = all.filter((l) => l.memberIds.includes(user.id));
        const myGroupList = await groups.getMyGroups(user.id);
        const requests = await listings.getMyRequests(user.id);
        const stats = await engagement.getStats(user.id);
        setMyListings(mine);
        setJoined(joined);
        setMyGroups(myGroupList);
        setMyRequests(requests);
        setLikes(mine.reduce((sum, l) => sum + (stats[l.id]?.likes ?? 0), 0));
        setViews(mine.reduce((sum, l) => sum + (stats[l.id]?.views ?? 0), 0));
        setPopular(popularIn(all));
        setError(null);
        try {
          setSkills(await users.getSkills(user.id));
          // Los guardados que ya no existen se ignoran (no hay llaves foráneas).
          const byId = new Map(all.map((l) => [l.id, l]));
          setSaved((await savedRepo.getSavedIds(user.id)).map((id) => byId.get(id)).filter((l): l is Listing => l != null));
          setExtrasError(null);
        } catch (e) {
          setExtrasError(messageOf(e, "No se pudieron cargar tus habilidades y guardados"));
        }
      } catch (e) {
        setError(messageOf(e, "No se pudo cargar tu perfil"));
      } finally {
        setLoading(false);
      }
    },
    [listings, groups, engagement, users, savedRepo, user.id],
  );

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Optimista: el chip aparece (o se va) al tocar y vuelve si Roble falla.
  const addSkill = async (skill: string) => {
    const clean = cleanSkill(skill);
    if (!clean || skills.some((s) => sameSkill(s, clean))) return;
    setSkillError(null);
    setSkills((list) => [...list, clean]);
    try {
      await users.addSkill(user.id, clean);
    } catch (e) {
      setSkills((list) => list.filter((s) => !sameSkill(s, clean)));
      setSkillError(messageOf(e, "No se pudo agregar la habilidad"));
    }
  };

  const removeSkill = async (skill: string) => {
    const index = skills.findIndex((s) => sameSkill(s, skill));
    if (index === -1) return;
    setSkillError(null);
    setSkills((list) => list.filter((s) => !sameSkill(s, skill)));
    try {
      await users.removeSkill(user.id, skill);
    } catch (e) {
      setSkills((list) => [...list.slice(0, index), skill, ...list.slice(index)]);
      setSkillError(messageOf(e, "No se pudo quitar la habilidad"));
    }
  };

  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    initials: initialsOf(user.name),
    myListings,
    myGroups,
    myRequests,
    // En lo que participo y no creé yo.
    participations: joinedListings.filter((l) => l.creatorId !== user.id),
    likesReceived,
    viewsReceived,
    skills,
    suggestedSkills: popularSkills.filter((p) => !skills.some((s) => sameSkill(s, p))).slice(0, 6),
    addSkill,
    removeSkill,
    skillError,
    saved,
    extrasError,
    isLoading,
    error,
    load,
  };
}

// Las habilidades que más se repiten en los proyectos, con la forma más común.
function popularIn(all: Listing[]): string[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const listing of all) {
    for (const skill of listing.requiredSkills) {
      const key = skillKey(skill);
      if (!key) continue;
      const entry = counts.get(key) ?? { label: cleanSkill(skill), count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).map((e) => e.label);
}
