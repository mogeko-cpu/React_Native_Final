import { useCallback, useEffect, useRef } from "react";

import { messageOf } from "../utils/failure";
import { UNDO_MS, useSnackbar } from "./SnackbarProvider";

type Pending = { timer: ReturnType<typeof setTimeout>; commit: () => Promise<void> };

// «Deshacer» para lo reversible (rechazar una solicitud, quitar un archivo).
//
// Roble no tiene papelera, así que deshacer de verdad sería volver a crear la
// fila con otro `_id`. Aquí la escritura **espera**: la pantalla esconde la
// fila al instante (`hide`), el aviso ofrece «Deshacer» unos segundos y solo
// al terminar se manda a Roble. Si se deshace, `restore` la vuelve a mostrar y
// no se escribió nada. Si la pantalla se cierra antes, la escritura sale en
// ese momento: cerrar no es deshacer.
export function useUndo() {
  const snackbar = useSnackbar();
  const pending = useRef(new Map<string, Pending>());

  useEffect(() => {
    const all = pending.current;
    return () => {
      for (const { timer, commit } of all.values()) {
        clearTimeout(timer);
        commit().catch(() => undefined);
      }
      all.clear();
    };
  }, []);

  return useCallback(
    (p: {
      key: string;
      title: string;
      message?: string;
      hide: () => void;
      restore: () => void;
      commit: () => Promise<void>;
      // Para avisar a otros después de escribir (una notificación, recargar).
      after?: () => void;
      errorTitle?: string;
    }) => {
      p.hide();
      const run = async () => {
        pending.current.delete(p.key);
        try {
          await p.commit();
          p.after?.();
        } catch (e) {
          p.restore();
          snackbar(p.errorTitle ?? "No se pudo completar", messageOf(e, "Intenta de nuevo."), { error: true });
        }
      };
      const timer = setTimeout(run, UNDO_MS);
      pending.current.set(p.key, { timer, commit: p.commit });
      snackbar(p.title, p.message, {
        action: {
          label: "Deshacer",
          onPress: () => {
            const entry = pending.current.get(p.key);
            if (!entry) return;
            clearTimeout(entry.timer);
            pending.current.delete(p.key);
            p.restore();
          },
        },
      });
    },
    [snackbar],
  );
}
