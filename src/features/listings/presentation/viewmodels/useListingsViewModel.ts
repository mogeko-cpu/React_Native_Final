import { useCallback, useEffect, useMemo, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { useErrorState } from "@/src/core/hooks/useErrorState";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { Listing, ListingStatus } from "../../domain/entities/Listing";
import { emptyStats, ListingStats } from "../../domain/entities/ListingStats";
import { EngagementRepository } from "../../domain/repositories/EngagementRepository";
import { ListingRepository } from "../../domain/repositories/ListingRepository";

// Explorar (`listings_view_model.dart`): todos los proyectos, filtrados en el
// teléfono por categoría, estado y texto. ROBLE solo filtra por igualdad, así
// que buscar ocurre aquí, sobre la lista completa.
export function useListingsViewModel() {
  const repository = useInject<ListingRepository>(TOKENS.ListingRepo);
  const engagement = useInject<EngagementRepository>(TOKENS.EngagementRepo);
  const user = useCurrentUser();

  const [all, setAll] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Record<string, ListingStats>>({});
  const [isLoading, setLoading] = useState(true);
  const [error, setError, lastError] = useErrorState();
  const [selectedCategory, setCategory] = useState<string | null>(null);
  const [selectedStatus, setStatus] = useState<ListingStatus | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        setAll(await repository.getListings());
        setStats(await engagement.getStats(user.id));
        setError(null);
      } catch (e) {
        setError(messageOf(e, "No se pudieron cargar los proyectos"));
      } finally {
        setLoading(false);
      }
    },
    [repository, engagement, user.id, setError],
  );

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const listings = useMemo(() => {
    const text = query.trim().toLowerCase();
    return all.filter(
      (l) =>
        (selectedCategory == null || l.category === selectedCategory) &&
        (selectedStatus == null || l.status === selectedStatus) &&
        (!text || l.title.toLowerCase().includes(text) || l.description.toLowerCase().includes(text)),
    );
  }, [all, selectedCategory, selectedStatus, query]);

  return {
    lastError,
    listings,
    isLoading,
    error,
    selectedCategory,
    selectedStatus,
    query,
    load,
    filterByCategory: setCategory,
    filterByStatus: setStatus,
    search: setQuery,
    statsOf: (listing: Listing) => stats[listing.id] ?? emptyStats,
  };
}
