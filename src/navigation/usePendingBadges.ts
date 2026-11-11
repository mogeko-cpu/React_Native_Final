import { useCallback, useEffect, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { usePoller } from "@/src/core/hooks/usePoller";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { isOwner, isPending } from "@/src/features/groups/domain/entities/Group";
import { GroupRepository } from "@/src/features/groups/domain/repositories/GroupRepository";
import { isLeader } from "@/src/features/listings/domain/entities/Listing";
import { ListingRepository } from "@/src/features/listings/domain/repositories/ListingRepository";
import { MentorshipRepository } from "@/src/features/listings/domain/repositories/MentorshipRepository";
import { useNotificationCenter } from "@/src/features/notifications/presentation/context/NotificationCenter";

export type PendingBadges = { Home: number; Groups: number };

// Lo que espera una respuesta mía, para las insignias de la barra de abajo:
// - **Inicio**: solicitudes para unirse a los proyectos que lidero y las
//   mentorías que me pidieron.
// - **Grupos**: invitaciones que me llegaron y solicitudes a los grupos que creé.
// Son pendientes de verdad (no avisos sin leer): la insignia baja al responder.
// Se vuelve a contar cada 45 s y cuando llega un aviso nuevo.
export function usePendingBadges(): PendingBadges {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const groups = useInject<GroupRepository>(TOKENS.GroupRepo);
  const mentorships = useInject<MentorshipRepository>(TOKENS.MentorshipRepo);
  const user = useCurrentUser();
  const { unreadCount } = useNotificationCenter();
  const [badges, setBadges] = useState<PendingBadges>({ Home: 0, Groups: 0 });

  const load = useCallback(async () => {
    const count = async (work: () => Promise<number>) => work().catch(() => 0);
    const home = await count(async () => {
      const led = (await listings.getListings()).filter((l) => isLeader(l, user.id));
      let total = (await mentorships.getMyInvitations(user.id)).length;
      for (const listing of led) total += (await listings.getRequestsForListing(listing.id)).filter((r) => r.status === "pending").length;
      return total;
    });
    const groupCount = await count(async () => {
      const owned = (await groups.getMyGroups(user.id)).filter((g) => isOwner(g, user.id));
      let total = (await groups.getMyInvitations(user.id)).length;
      for (const group of owned) total += (await groups.getRequestsForGroup(group.id)).filter(isPending).length;
      return total;
    });
    setBadges({ Home: home, Groups: groupCount });
  }, [listings, groups, mentorships, user.id]);

  useEffect(() => {
    // Contar al entrar y con cada aviso nuevo: el estado cambia después del `await`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, unreadCount]);

  usePoller(load, 45_000);
  return badges;
}
