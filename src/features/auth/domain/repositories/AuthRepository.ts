import { AuthUser } from "../entities/AuthUser";

// La sesión. Campus Innovate exige cuenta: sin sesión solo se ve el login.
export interface AuthRepository {
  // Al arrancar: la sesión guardada, si sigue sirviendo. Estar sin red **no**
  // la cierra: no poder preguntar no es lo mismo que estar expulsado.
  restoreSession(): Promise<AuthUser | null>;
  login(email: string, password: string): Promise<AuthUser>;
  // Crea la cuenta, sin entrar. Roble manda un código de 6 dígitos al correo y
  // la cuenta no sirve hasta confirmarlo con `verifyEmail`.
  signUp(name: string, email: string, password: string): Promise<void>;
  verifyEmail(email: string, code: string): Promise<void>;
  resendVerification(email: string): Promise<void>;
  // Recuperar la contraseña: primero se pide el código al correo y después se
  // pone la nueva con él (sirve también el enlace completo del correo).
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(codeOrLink: string, newPassword: string): Promise<void>;
  // Lleva a la persona a Google. En la web la pestaña se va y la sesión se
  // abre al volver (`completeGoogleSignIn`), así que devuelve `null`; en el
  // teléfono espera el regreso y devuelve la sesión (o `null` si se canceló).
  startGoogleSignIn(): Promise<AuthUser | null>;
  // Si la app vuelve de Google, abre la sesión con el código. `null` si no
  // es un regreso de Google.
  completeGoogleSignIn(): Promise<AuthUser | null>;
  logout(): Promise<void>;
  onSessionExpired(listener: () => void): () => void;
}
