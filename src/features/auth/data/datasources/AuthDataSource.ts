import { Row } from "@/src/core/roble/guard";

// Lo que la feature necesita que alguien sepa hablar sobre cuentas. Devuelve
// el perfil tal como llega; convertirlo es del repositorio.
export interface AuthDataSource {
  // `true` si la sesión guardada sigue valiendo. Sin red, lanza.
  restoreSession(): Promise<boolean>;
  // Abre la sesión guardada sin preguntarle al servidor.
  restoreOffline(): Promise<boolean>;
  currentUser(): Promise<Row>;
  // El último perfil visto, para arrancar sin red.
  cachedUser(): Promise<Row | null>;
  login(email: string, password: string): Promise<Row>;
  // Crea la cuenta y manda un código al correo: no queda activa hasta verificarla.
  signUp(name: string, email: string, password: string): Promise<void>;
  verifyEmail(email: string, code: string): Promise<void>;
  resendCode(email: string): Promise<void>;
  // Manda al correo el código para poner una contraseña nueva.
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  // `redirect` es el *nombre* del destino registrado en la consola de Roble.
  startSocialLogin(provider: string, redirect: string): Promise<string>;
  exchangeSocialCode(code: string): Promise<Row>;
  logout(): Promise<void>;
  onSessionExpired(listener: () => void): () => void;
}
