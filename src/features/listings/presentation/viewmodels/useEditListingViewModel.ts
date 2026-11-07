import { useCallback, useEffect, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { useErrorState } from "@/src/core/hooks/useErrorState";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { isLeader, Listing, ListingStatus, memberCount } from "../../domain/entities/Listing";
import { ListingRepository, MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "../../domain/repositories/ListingRepository";

// Editar un proyecto (`edit_listing_view_model.dart`). Solo el líder. Marcarlo
// «Terminado» rechaza las solicitudes que esperaban y le avisa a cada quien.
export function useEditListingViewModel(listingId: string) {
  const repository = useInject<ListingRepository>(TOKENS.ListingRepo);
  const notifier = useInject<NotificationPublisher>(TOKENS.NotificationPublisher);
  const user = useCurrentUser();

  const [listing, setListing] = useState<Listing | null>(null);
  const [category, selectCategory] = useState("");
  const [maxMembers, setMax] = useState(4);
  const [requiredSkills, setSkills] = useState<string[]>([]);
  const [status, selectStatus] = useState<ListingStatus>("idea");
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError, lastError] = useErrorState();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await repository.getListingById(listingId);
      if (!found) {
        setError("Proyecto no encontrado");
        return;
      }
      if (!isLeader(found, user.id)) {
        setError("Solo el líder del proyecto puede editarlo.");
        return;
      }
      setListing(found);
      selectCategory(found.category);
      setMax(found.maxMembers);
      setSkills(found.requiredSkills);
      selectStatus(found.status);
    } catch (e) {
      setError(messageOf(e, "No se pudo cargar el proyecto"));
    } finally {
      setLoading(false);
    }
  }, [repository, listingId, user.id, setError]);

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // No se puede achicar por debajo de quienes ya están.
  const minMembers = Math.max(listing ? memberCount(listing) : 0, MIN_TEAM_SIZE);
  const closesRequests = status === "done" && listing?.status !== "done";

  const addSkill = (skill: string) => {
    const clean = skill.trim();
    if (!clean || requiredSkills.includes(clean)) return;
    setSkills([...requiredSkills, clean]);
  };

  const submit = async (title: string, description: string): Promise<Listing | null> => {
    const current = listing;
    if (!current || isSaving) return null;
    setSaving(true);
    setError(null);
    try {
      const saved = await repository.updateListing({ ...current, title, description, category, maxMembers, requiredSkills, status }, user.id);
      if (saved.status === "done" && current.status !== "done") await closeRequests(saved);
      setListing(saved);
      return saved;
    } catch (e) {
      setError(messageOf(e, "No se pudieron guardar los cambios"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const closeRequests = async (saved: Listing) => {
    try {
      const closed = await repository.closePendingRequests(saved.id);
      for (const request of closed) {
        await notifier.requestResolved({
          accepted: false,
          target: "listing",
          targetId: saved.id,
          targetName: saved.title,
          deciderId: user.id,
          applicantId: request.applicantId,
        });
      }
    } catch {
      // El proyecto ya quedó guardado; avisar es lo de menos.
    }
  };

  return {
    lastError,
    listing,
    category,
    selectCategory,
    maxMembers,
    setMaxMembers: (value: number) => setMax(Math.min(MAX_TEAM_SIZE, Math.max(minMembers, value))),
    minMembers,
    requiredSkills,
    addSkill,
    removeSkill: (skill: string) => setSkills(requiredSkills.filter((s) => s !== skill)),
    status,
    selectStatus,
    closesRequests,
    isLoading,
    isSaving,
    error,
    submit,
  };
}
