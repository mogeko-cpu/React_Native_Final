import { useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { useErrorState } from "@/src/core/hooks/useErrorState";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { ListingRepository } from "../../domain/repositories/ListingRepository";

// Postularse a un proyecto (`join_request_view_model.dart`).
export function useJoinRequestViewModel(listingId: string) {
  const repository = useInject<ListingRepository>(TOKENS.ListingRepo);
  const notifier = useInject<NotificationPublisher>(TOKENS.NotificationPublisher);
  const user = useCurrentUser();
  const [isSending, setSending] = useState(false);
  const [error, setError, lastError] = useErrorState();

  const submit = async (form: { motivation: string; skills: string; availability: string }): Promise<boolean> => {
    setSending(true);
    setError(null);
    try {
      await repository.createJoinRequest({
        listingId,
        applicantId: user.id,
        applicantName: user.name,
        motivation: form.motivation.trim(),
        skills: form.skills.trim(),
        availability: form.availability.trim(),
      });
      await notifyCreator();
      return true;
    } catch (e) {
      setError(messageOf(e, "No se pudo enviar la solicitud"));
      return false;
    } finally {
      setSending(false);
    }
  };

  const notifyCreator = async () => {
    try {
      const listing = await repository.getListingById(listingId);
      if (!listing) return;
      await notifier.joinRequestReceived({
        target: "listing",
        targetId: listing.id,
        targetName: listing.title,
        applicantId: user.id,
        applicantName: user.name,
        recipientId: listing.creatorId,
      });
    } catch {
      // La solicitud ya quedó; el aviso es lo de menos.
    }
  };

  return { isSending, error, lastError, submit };
}
