import { useCallback, useRef, useState } from "react";

// El error de un view model, para pintarlo **y** para leerlo justo después de
// un `await`. En Flutter la pantalla leía `controller.error.value` al volver de
// la acción; en React el estado nuevo todavía no llegó a ese render, así que
// `lastError()` lo lee de una referencia.
export function useErrorState(): [string | null, (message: string | null) => void, () => string | null] {
  const [error, setErrorState] = useState<string | null>(null);
  const ref = useRef<string | null>(null);
  const setError = useCallback((message: string | null) => {
    ref.current = message;
    setErrorState(message);
  }, []);
  const lastError = useCallback(() => ref.current, []);
  return [error, setError, lastError];
}
