import { useCallback, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { AuthRepository } from "../../domain/repositories/AuthRepository";

// Lo que pasa fuera de la sesión con el correo: verificar la cuenta nueva y
// recuperar la contraseña. Cada acción devuelve si salió bien; el error queda
// en `error` para que la pantalla lo muestre debajo del campo.
export function useAccountViewModel() {
  const auth = useInject<AuthRepository>(TOKENS.AuthRepo);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async (action: () => Promise<void>, fallback: string) => {
    setError("");
    setLoading(true);
    try {
      await action();
      return true;
    } catch (e) {
      setError(messageOf(e, fallback));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    clearError: () => setError(""),
    verifyEmail: (email: string, code: string) => run(() => auth.verifyEmail(email, code), "No se pudo verificar la cuenta."),
    resendVerification: (email: string) => run(() => auth.resendVerification(email), "No se pudo reenviar el código."),
    requestPasswordReset: (email: string) => run(() => auth.requestPasswordReset(email), "No se pudo enviar el código."),
    resetPassword: (code: string, password: string) => run(() => auth.resetPassword(code, password), "No se pudo cambiar la contraseña."),
  };
}
