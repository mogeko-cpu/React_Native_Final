import { useCallback, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { useErrorState } from "@/src/core/hooks/useErrorState";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { JoinRequest, JoinRequestStatus } from "../../domain/entities/JoinRequest";
import { ListingRepository } from "../../domain/repositories/ListingRepository";

// Las solicitudes que recibe un proyecto, para su líder (`requests_view_model.dart`).
export function useRequestsViewModel() {
  const repository = useInject<ListingRepository>(TOKENS.ListingRepo);
  const notifier = useInject<NotificationPublisher>(TOKENS.NotificationPublisher);
  const user = useCurrentUser();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError, lastError] = useErrorState();
  const [target, setTarget] = useState({ listingId: "", listingTitle: "" });

  const load = useCallback(
    async (listingId: string, listingTitle: string) => {
      setTarget({ listingId, listingTitle });
      setLoading(true);
      setError(null);
      try {
        setRequests(await repository.getRequestsForListing(listingId));
      } catch (e) {
        setError(messageOf(e, "No se pudieron cargar las solicitudes"));
      } finally {
        setLoading(false);
      }
    },
    [repository, setError],
  );

  const resolve = async (requestId: string, status: JoinRequestStatus) => {
    setError(null);
    try {
      const request = requests.find((r) => r.id === requestId);
      if (status === "accepted") await repository.acceptJoinRequest(requestId);
      else await repository.rejectJoinRequest(requestId);
      setRequests((list) => list.map((r) => (r.id === requestId ? { ...r, status } : r)));
      if (request) {
        await notifier.requestResolved({
          accepted: status === "accepted",
          target: "listing",
          targetId: target.listingId,
          targetName: target.listingTitle,
          deciderId: user.id,
          applicantId: request.applicantId,
        });
      }
    } catch (e) {
      setError(messageOf(e, "No se pudo actualizar la solicitud"));
    }
  };

  return {
    requests,
    pending: requests.filter((r) => r.status === "pending"),
    isLoading,
    error,
    lastError,
    load,
    accept: (requestId: string) => resolve(requestId, "accepted"),
    reject: (requestId: string) => resolve(requestId, "rejected"),
  };
}
