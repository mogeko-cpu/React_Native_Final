import { RobleApiHttpException, RobleApiNetworkException, RobleApiTimeoutException } from "roble-client";

import { guardRoble, Row, translateRobleError } from "@/src/core/roble/guard";
import { PasswordPolicy } from "@/src/core/roble/passwordPolicy";
import { SocialBrowser } from "@/src/core/platform/SocialBrowser";
import { AuthFailure } from "../../domain/AuthFailure";
import { AuthUser } from "../../domain/entities/AuthUser";
import { AuthRepository } from "../../domain/repositories/AuthRepository";
import { AuthDataSource } from "../datasources/AuthDataSource";

const failure = (message: string) => new AuthFailure(message);

// La sesión: decide y traduce, no habla (`roble_authentication_source.dart` +
// `auth_repository.dart`). El paquete guarda y renueva los tokens.
export class AuthRepositoryImpl implements AuthRepository {
  private socialCodeRead = false;

  constructor(private readonly source: AuthDataSource) {}

  onSessionExpired(listener: () => void) {
    return this.source.onSessionExpired(listener);
  }

  async restoreSession(): Promise<AuthUser | null> {
    try {
      if (!(await this.source.restoreSession())) return null;
      return toUser(await this.source.currentUser());
    } catch (e) {
      // Sin red al arrancar: se sigue con la sesión guardada y el último perfil.
      if (e instanceof RobleApiNetworkException || e instanceof RobleApiTimeoutException) {
        const cached = await this.source.cachedUser();
        if (cached && (await this.source.restoreOffline())) return toUser(cached);
      }
      return null;
    }
  }

  async login(email: string, password: string): Promise<AuthUser> {
    try {
      return toUser(await this.source.login(email.trim(), password));
    } catch (e) {
      if (e instanceof RobleApiHttpException && e.statusCode === 401) throw failure("Correo o contraseña incorrectos.");
      throw translateRobleError(e, failure);
    }
  }

  async signUp(name: string, email: string, password: string): Promise<void> {
    // Se revisa antes: una contraseña que Roble rechace gasta uno de los 5
    // registros por hora igual.
    const rejection = PasswordPolicy.validate(password);
    if (rejection) throw failure(rejection);
    await guardRoble(() => this.source.signUp(name.trim(), email.trim(), password), failure);
  }

  async startGoogleSignIn(): Promise<void> {
    if (!SocialBrowser.isSupported) {
      throw failure("Por ahora el inicio de sesión con Google funciona en la versión web de Campus Innovate.");
    }
    const url = await guardRoble(() => this.source.startSocialLogin("google"), failure);
    SocialBrowser.goTo(url);
  }

  async completeGoogleSignIn(): Promise<AuthUser | null> {
    if (this.socialCodeRead) return null;
    this.socialCodeRead = true;
    const { code, error, errorDescription } = SocialBrowser.readReturn();
    if (!code && !error) return null;
    SocialBrowser.dropQuery();
    if (error) {
      const detail = errorDescription?.trim();
      throw failure(detail ? `Google no autorizó el inicio de sesión: ${detail}` : `Google no autorizó el inicio de sesión (${error}).`);
    }
    return toUser(await guardRoble(() => this.source.exchangeSocialCode(code!), failure));
  }

  async logout(): Promise<void> {
    try {
      await this.source.logout();
    } catch {
      // Token ya inválido o sin red: lo que sigue es lo mismo, sin sesión.
    }
  }
}

// Las cuentas creadas fuera de la app pueden no tener nombre: la parte local
// del correo saluda mejor que un texto vacío (`roble_user.dart`).
function toUser(profile: Row): AuthUser {
  const id = String(profile.userId ?? profile.id ?? profile.sub ?? "");
  if (!id) throw failure("La respuesta de ROBLE no trae el id del usuario");
  const email = String(profile.email ?? "");
  const name = String(profile.name ?? "").trim() || email.split("@")[0] || "Estudiante";
  return { id, name, email };
}
