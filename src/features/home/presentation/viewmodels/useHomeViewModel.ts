import { useCallback, useEffect, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { isRecruiting, Listing } from "@/src/features/listings/domain/entities/Listing";
import { emptyStats, ListingStats } from "@/src/features/listings/domain/entities/ListingStats";
import { MentorshipRequest } from "@/src/features/listings/domain/entities/MentorshipRequest";
import { EngagementRepository } from "@/src/features/listings/domain/repositories/EngagementRepository";
import { ListingRepository } from "@/src/features/listings/domain/repositories/ListingRepository";
import { MentorshipRepository } from "@/src/features/listings/domain/repositories/MentorshipRepository";
import { Recommendation, recommendListings } from "@/src/features/listings/domain/recommendations";
import { UserRepository } from "@/src/features/users/domain/repositories/UserRepository";

// Inicio (`home_view_model.dart`): ideas destacadas, recomendados por mis
// habilidades, lo que me piden como mentor y mis proyectos. Es también donde cada quien se anota en el
// directorio, porque aquí terminan todas las formas de iniciar sesión.
export function useHomeViewModel() {
  const repository = useInject<ListingRepository>(TOKENS.ListingRepo);
  const engagement = useInject<EngagementRepository>(TOKENS.EngagementRepo);
  const users = useInject<UserRepository>(TOKENS.UserRepo);
  const mentorships = useInject<MentorshipRepository>(TOKENS.MentorshipRepo);
  const user = useCurrentUser();

  const [featuredListings, setFeatured] = useState<Listing[]>([]);
  const [myListings, setMine] = useState<Listing[]>([]);
  const [recommended, setRecommended] = useState<Recommendation[]>([]);
  // `null` si no se pudieron leer (la tabla aún no existe): no se ofrece nada.
  const [mySkills, setMySkills] = useState<string[] | null>(null);
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
        // Una sola lectura de proyectos para las tres listas: Roble cobra cada
        // petición contra el límite por minuto. Son las mismas reglas de
        // `getFeaturedListings` y `getJoinedListings`.
        const all = await repository.getListings();
        const counters = await engagement.getStats(user.id);
        const skills = await users.getSkills(user.id).catch(() => null);
        setFeatured(all.filter(isRecruiting).slice(0, 5));
        setMine(all.filter((l) => l.memberIds.includes(user.id)));
        setMySkills(skills);
        setRecommended(skills ? recommendListings(all, skills, user.id) : []);
        setMentorshipRequests(await mentorships.getMyInvitations(user.id).catch(() => []));
        setStats(counters);
        setError(null);
      } catch (e) {
        setError(messageOf(e, "No se pudieron cargar las ideas"));
      } finally {
        setLoading(false);
      }
    },
    [repository, engagement, mentorships, users, user.id],
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
    recommended,
    // Sin habilidades en el Perfil no hay qué recomendar: se invita a ponerlas.
    needsSkills: mySkills != null && mySkills.length === 0,
    hasSkills: mySkills != null && mySkills.length > 0,
    myListings,
    mentorshipRequests,
    isLoading,
    error,
    load,
    statsOf: (listing: Listing) => stats[listing.id] ?? emptyStats,
  };
}
