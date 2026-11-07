import { useCallback, useEffect, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { useErrorState } from "@/src/core/hooks/useErrorState";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { emptyStats, ReactionType } from "../../domain/entities/ListingStats";
import { rank, RankedListing } from "../../domain/entities/RankedListing";
import { EngagementRepository } from "../../domain/repositories/EngagementRepository";
import { ListingRepository } from "../../domain/repositories/ListingRepository";

// El ranking del campus (`ranking_view_model.dart`): el puntaje son los me gusta
// menos los no me gusta; los comentarios y las vistas desempatan.
export function useRankingViewModel() {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const engagement = useInject<EngagementRepository>(TOKENS.EngagementRepo);
  const user = useCurrentUser();

  const [ranking, setRanking] = useState<RankedListing[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError, lastError] = useErrorState();

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const all = await listings.getListings();
        const stats = await engagement.getStats(user.id);
        setRanking(rank(all, stats, emptyStats));
        setError(null);
      } catch (e) {
        setError(messageOf(e, "No se pudo cargar el ranking"));
      } finally {
        setLoading(false);
      }
    },
    [listings, engagement, user.id, setError],
  );

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const react = async (listingId: string, reaction: ReactionType) => {
    const entry = ranking.find((e) => e.listing.id === listingId);
    if (!entry) return;
    try {
      await engagement.toggleReaction({ listingId, groupId: entry.listing.groupId, userId: user.id, reaction, current: entry.stats.myReaction });
      await load(true);
    } catch (e) {
      setError(messageOf(e, "No se pudo registrar tu valoración"));
    }
  };

  const totalLikes = ranking.reduce((sum, e) => sum + e.stats.likes, 0);

  return { ranking, isLoading, error, lastError, load, react, totalLikes };
}
