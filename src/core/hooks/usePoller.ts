import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef } from "react";

// Vuelve a leer sola mientras la pantalla está a la vista (`poller.dart`).
// ROBLE no tiene canal de empuje, así que lo que otras personas hacen solo se
// ve leyendo otra vez. Cada lectura es silenciosa y se pausa cuando otra
// pantalla queda encima, para no gastar el límite de tasa dos veces.
export function usePoller(action: () => Promise<void>, intervalMs: number, enabled = true) {
  const focused = useIsFocused();
  const latest = useRef(action);
  const running = useRef(false);

  useEffect(() => {
    latest.current = action;
  });

  useEffect(() => {
    if (!focused || !enabled || usePoller.disabled) return;
    const id = setInterval(async () => {
      if (running.current) return;
      running.current = true;
      try {
        await latest.current();
      } catch {
        // Ignorado a propósito: una lectura automática que falla no se anuncia.
      } finally {
        running.current = false;
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [focused, enabled, intervalMs]);
}

// Las pruebas lo apagan para no dejar temporizadores vivos.
usePoller.disabled = false;
