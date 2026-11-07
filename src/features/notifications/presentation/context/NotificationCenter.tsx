import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { AppNotification } from "../../domain/entities/AppNotification";
import { NotificationRepository } from "../../domain/repositories/NotificationRepository";

type NotificationCenterViewModel = {
  notifications: AppNotification[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (notification: AppNotification) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const Context = createContext<NotificationCenterViewModel | null>(null);

// Cada 30 segundos (`notification_center.dart`): es permanente, porque la
// campana de cada pestaña y la lista leen la misma instancia. Lo que llega nuevo
// se anuncia arriba, una vez.
export const NOTIFICATIONS_INTERVAL = 30_000;

export function NotificationCenterProvider({ children, interval = NOTIFICATIONS_INTERVAL }: { children: React.ReactNode; interval?: number }) {
  const repository = useInject<NotificationRepository>(TOKENS.NotificationRepo);
  const { user } = useSession();
  const snackbar = useSnackbar();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const seen = useRef<Set<string> | null>(null);
  const userId = user?.id ?? null;
  const owner = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    // Otra persona entró: lo de la anterior no se mezcla.
    if (owner.current !== userId) {
      owner.current = userId;
      seen.current = null;
      setNotifications([]);
    }
    try {
      const fetched = await repository.getMine(userId);
      if (owner.current !== userId) return;
      const previous = seen.current;
      seen.current = new Set(fetched.map((n) => n.id));
      if (previous) {
        const fresh = fetched.filter((n) => !n.isRead && !previous.has(n.id));
        if (fresh.length === 1) snackbar(fresh[0].title, fresh[0].body, { top: true });
        else if (fresh.length > 1) snackbar(`Tienes ${fresh.length} notificaciones nuevas`, "Toca la campana para verlas.", { top: true });
      }
      setNotifications(fetched);
    } catch {
      // Una lectura automática que falla no se anuncia.
    }
  }, [repository, userId, snackbar]);

  useEffect(() => {
    if (!userId) {
      owner.current = null;
      seen.current = null;
      // Cargar al abrir: el estado cambia después del `await`, no al instante.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications([]);
      return;
    }
    refresh();
    if (interval <= 0) return;
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [userId, refresh, interval]);

  const markRead = useCallback(
    async (notification: AppNotification) => {
      if (notification.isRead) return;
      setNotifications((list) => list.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      try {
        await repository.markRead(notification.id);
      } catch {
        // Queda leída aquí; la próxima lectura dirá la verdad.
      }
    },
    [repository],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
    try {
      await repository.markAllRead(userId);
    } catch {
      // Ídem.
    }
  }, [repository, userId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const value = useMemo(() => ({ notifications, unreadCount, refresh, markRead, markAllRead }), [notifications, unreadCount, refresh, markRead, markAllRead]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNotificationCenter() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("NotificationCenterProvider missing");
  return ctx;
}
