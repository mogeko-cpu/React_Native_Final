import { useCallback, useEffect, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { Listing } from "@/src/features/listings/domain/entities/Listing";
import { emptyStats, ListingStats } from "@/src/features/listings/domain/entities/ListingStats";
import { MentorshipRequest } from "@/src/features/listings/domain/entities/MentorshipRequest";
import { EngagementRepository } from "@/src/features/listings/domain/repositories/EngagementRepository";
import { ListingRepository } from "@/src/features/listings/domain/repositories/ListingRepository";
import { MentorshipRepository } from "@/src/features/listings/domain/repositories/MentorshipRepository";
import { UserRepository } from "@/src/features/users/domain/repositories/UserRepository";

// Inicio (`home_view_model.dart`): ideas destacadas, lo que me piden como
// mentor y mis proyectos. Es también donde cada quien se anota en el
// directorio, porque aquí terminan todas las formas de iniciar sesión.
export function useHomeViewModel() {
  const repository = useInject<ListingRepository>(TOKENS.ListingRepo);
  const engagement = useInject<EngagementRepository>(TOKENS.EngagementRepo);
  const users = useInject<UserRepository>(TOKENS.UserRepo);
  const mentorships = useInject<MentorshipRepository>(TOKENS.MentorshipRepo);
  const user = useCurrentUser();

  const [featuredListings, setFeatured] = useState<Listing[]>([]);
  const [myListings, setMine] = useState<Listing[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [stats, setStats] = useState<Record<string, ListingStats>>({});
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const featured = await repository.getFeaturedListings();
        const mine = await repository.getJoinedListings(user.id);
        const counters = await engagement.getStats(user.id);
        setFeatured(featured);
        setMine(mine);
        setMentorshipRequests(await mentorships.getMyInvitations(user.id).catch(() => []));
        setStats(counters);
        setError(null);
      } catch (e) {
        setError(messageOf(e, "No se pudieron cargar las ideas"));
      } finally {
        setLoading(false);
      }
    },
    [repository, engagement, mentorships, user.id],
  );

  useEffect(() => {
    // Anotarse en el directorio no puede tumbar Inicio.
    users.registerCurrentUser({ id: user.id, name: user.name, email: user.email }).catch(() => undefined);
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [users, user.id, user.name, user.email, load]);

  return {
    firstName: user.name.split(" ")[0],
    featuredListings,
    myListings,
    mentorshipRequests,
    isLoading,
    error,
    load,
    statsOf: (listing: Listing) => stats[listing.id] ?? emptyStats,
  };
}
