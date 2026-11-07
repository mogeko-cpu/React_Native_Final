import { AuthUser } from "../entities/AuthUser";

// La sesión. Campus Innovate exige cuenta: sin sesión solo se ve el login.
export interface AuthRepository {
  // Al arrancar: la sesión guardada, si sigue sirviendo. Estar sin red **no**
  // la cierra: no poder preguntar no es lo mismo que estar expulsado.
  restoreSession(): Promise<AuthUser | null>;
  login(email: string, password: string): Promise<AuthUser>;
  // Crea la cuenta, sin entrar: después se inicia sesión con ella.
  signUp(name: string, email: string, password: string): Promise<void>;
  // Lleva a la persona a Google (solo en la versión web).
  startGoogleSignIn(): Promise<void>;
  // Si la app vuelve de Google, abre la sesión con el código. `null` si no
  // es un regreso de Google.
  completeGoogleSignIn(): Promise<AuthUser | null>;
  logout(): Promise<void>;
  onSessionExpired(listener: () => void): () => void;
}
