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

// El perfil (`profile_view_model.dart`): quién soy, mis cifras, mis grupos, lo
// que publiqué, en lo que participo y mis solicitudes.
export function useProfileViewModel() {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const groups = useInject<GroupRepository>(TOKENS.GroupRepo);
  const engagement = useInject<EngagementRepository>(TOKENS.EngagementRepo);
  const user = useCurrentUser();

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [joinedListings, setJoined] = useState<Listing[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [likesReceived, setLikes] = useState(0);
  const [viewsReceived, setViews] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const mine = await listings.getMyListings(user.id);
        const joined = await listings.getJoinedListings(user.id);
        const myGroupList = await groups.getMyGroups(user.id);
        const requests = await listings.getMyRequests(user.id);
        const stats = await engagement.getStats(user.id);
        setMyListings(mine);
        setJoined(joined);
        setMyGroups(myGroupList);
        setMyRequests(requests);
        setLikes(mine.reduce((sum, l) => sum + (stats[l.id]?.likes ?? 0), 0));
        setViews(mine.reduce((sum, l) => sum + (stats[l.id]?.views ?? 0), 0));
        setError(null);
      } catch (e) {
        setError(messageOf(e, "No se pudo cargar tu perfil"));
      } finally {
        setLoading(false);
      }
    },
    [listings, groups, engagement, user.id],
  );

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

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
    isLoading,
    error,
    load,
  };
}
