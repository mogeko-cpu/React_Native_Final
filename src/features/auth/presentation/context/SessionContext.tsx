import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { PasswordPolicy } from "@/src/core/roble/passwordPolicy";
import { messageOf } from "@/src/core/utils/failure";
import { UnverifiedEmailFailure } from "../../domain/AuthFailure";
import { AuthUser } from "../../domain/entities/AuthUser";
import { AuthRepository } from "../../domain/repositories/AuthRepository";

export type LoginResult = "ok" | "unverified" | "failed";

export type SessionViewModel = {
  // `false` mientras se recupera la sesión guardada (el splash sigue visible).
  ready: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: string;
  // El error del regreso de Google: la pantalla de login lo muestra al abrir.
  pendingSocialError: string;
  consumeSocialError: () => string;
  // `unverified`: la cuenta existe pero falta el código del correo.
  login: (email: string, password: string) => Promise<LoginResult>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  logOut: () => Promise<void>;
};

const SessionContext = createContext<SessionViewModel | undefined>(undefined);

// Quién está dentro (`authentication_controller.dart`). Vive toda la vida de la
// app: Campus Innovate exige cuenta, así que la sesión decide si se ve el login
// o las pestañas.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const auth = useInject<AuthRepository>(TOKENS.AuthRepo);
  const snackbar = useSnackbar();

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingSocialError, setPendingSocialError] = useState("");
  const userRef = useRef<AuthUser | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Al arrancar: la sesión guardada; si no hay, puede ser un regreso de Google.
  useEffect(() => {
    let active = true;
    (async () => {
      let restored: AuthUser | null = null;
      try {
        restored = await auth.restoreSession();
      } catch {
        restored = null;
      }
      if (!restored) {
        try {
          restored = await auth.completeGoogleSignIn();
        } catch (e) {
          if (active) setPendingSocialError(messageOf(e, "No se pudo completar el inicio de sesión con Google."));
        }
      }
      if (!active) return;
      if (!userRef.current) setUser(restored);
      setReady(true);
    })();
    const stop = auth.onSessionExpired(() => {
      if (!userRef.current) return;
      setUser(null);
      snackbar("Tu sesión expiró", "Vuelve a iniciar sesión.", { error: true });
    });
    return () => {
      active = false;
      stop();
    };
  }, [auth, snackbar]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError("");
      if (!isEmail(email) || !password) {
        setError("Escribe tu correo institucional y tu contraseña.");
        return "failed" as const;
      }
      setLoading(true);
      try {
        setUser(await auth.login(email, password));
        return "ok" as const;
      } catch (e) {
        setError(messageOf(e, "No se pudo iniciar sesión. Intenta de nuevo."));
        return e instanceof UnverifiedEmailFailure ? ("unverified" as const) : ("failed" as const);
      } finally {
        setLoading(false);
      }
    },
    [auth],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setError("");
      if (name.trim().length < 3) {
        setError("Escribe tu nombre completo.");
        return false;
      }
      if (!isEmail(email)) {
        setError("Escribe un correo válido.");
        return false;
      }
      const rejection = PasswordPolicy.validate(password);
      if (rejection) {
        setError(rejection);
        return false;
      }
      setLoading(true);
      try {
        await auth.signUp(name, email, password);
        return true;
      } catch (e) {
        setError(messageOf(e, "No se pudo crear la cuenta. Intenta de nuevo."));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [auth],
  );

  const signInWithGoogle = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const signedIn = await auth.startGoogleSignIn();
      if (signedIn) setUser(signedIn);
      return true;
    } catch (e) {
      setError(messageOf(e, "No se pudo iniciar sesión con Google. Intenta de nuevo."));
      return false;
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const logOut = useCallback(async () => {
    setError("");
    await auth.logout();
    setUser(null);
  }, [auth]);

  const consumeSocialError = useCallback(() => {
    const pending = pendingSocialError;
    setPendingSocialError("");
    return pending;
  }, [pendingSocialError]);

  const value = useMemo<SessionViewModel>(
    () => ({ ready, user, isLoading, error, pendingSocialError, consumeSocialError, login, signUp, signInWithGoogle, logOut }),
    [ready, user, isLoading, error, pendingSocialError, consumeSocialError, login, signUp, signInWithGoogle, logOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

// Quien está dentro, en las pantallas que solo existen con sesión
// (`ISessionService` en Flutter).
export function useCurrentUser(): AuthUser {
  const { user } = useSession();
  if (!user) throw new Error("No hay sesión activa: esta pantalla exige haber iniciado sesión.");
  return user;
}

function isEmail(email: string): boolean {
  const value = email.trim();
  return value.length > 4 && value.includes("@") && value.includes(".") && !value.includes(" ");
}
