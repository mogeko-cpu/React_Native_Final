import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef } from "react";

// Vuelve a leer al regresar de otra pantalla. Flutter lo hacía con
// `await Get.toNamed(ruta); await controller.load();`: lo que la persona hizo
// allá (publicar, unirse, comentar) se ve al volver.
export function useReturnRefresh(reload: () => void) {
  const first = useRef(true);
  const latest = useRef(reload);
  useEffect(() => {
    latest.current = reload;
  });
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      latest.current();
    }, []),
  );
}
