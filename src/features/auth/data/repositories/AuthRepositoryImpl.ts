import { RobleApiHttpException, RobleApiNetworkException, RobleApiTimeoutException } from "roble-client";

import { guardRoble, Row, translateRobleError } from "@/src/core/roble/guard";
import { PasswordPolicy } from "@/src/core/roble/passwordPolicy";
import { SocialBrowser, SocialReturn } from "@/src/core/platform/SocialBrowser";
import { robleConfig } from "@/src/core/roble/robleConfig";
import { AuthFailure, UnverifiedEmailFailure } from "../../domain/AuthFailure";
import { AuthUser } from "../../domain/entities/AuthUser";
import { AuthRepository } from "../../domain/repositories/AuthRepository";
import { AuthDataSource } from "../datasources/AuthDataSource";

const failure = (message: string) => new AuthFailure(message);

export const MOBILE_GOOGLE_PENDING =
  "Continuar con Google en el teléfono aún no está habilitado en Roble. Mientras tanto, entra con tu correo o desde la versión web.";

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
      if (isUnverified(e)) throw new UnverifiedEmailFailure(email.trim());
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

  async verifyEmail(email: string, code: string): Promise<void> {
    const clean = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(clean)) throw failure("El código tiene 6 dígitos.");
    try {
      await this.source.verifyEmail(email.trim(), clean);
    } catch (e) {
      if (e instanceof RobleApiHttpException && (e.statusCode === 400 || e.statusCode === 401)) {
        throw failure("El código no es válido o ya venció. Pide uno nuevo.");
      }
      throw translateRobleError(e, failure);
    }
  }

  async resendVerification(email: string): Promise<void> {
    await guardRoble(() => this.source.resendCode(email.trim()), failure);
  }

  async requestPasswordReset(email: string): Promise<void> {
    if (!isEmail(email)) throw failure("Escribe el correo con el que creaste tu cuenta.");
    await guardRoble(() => this.source.forgotPassword(email.trim()), failure);
  }

  async resetPassword(codeOrLink: string, newPassword: string): Promise<void> {
    const token = tokenFrom(codeOrLink);
    if (!token) throw failure("Escribe el código que te llegó al correo.");
    // Igual que al registrarse: se revisa antes de gastar una petición.
    const rejection = PasswordPolicy.validate(newPassword);
    if (rejection) throw failure(rejection);
    try {
      await this.source.resetPassword(token, newPassword);
    } catch (e) {
      if (e instanceof RobleApiHttpException && (e.statusCode === 400 || e.statusCode === 401)) {
        throw failure("El código no es válido o ya venció. Pide uno nuevo.");
      }
      throw translateRobleError(e, failure);
    }
  }

  async startGoogleSignIn(): Promise<AuthUser | null> {
    if (SocialBrowser.isWeb) {
      const url = await guardRoble(() => this.source.startSocialLogin("google", robleConfig.socialRedirect), failure);
      SocialBrowser.goTo(url);
      return null;
    }
    let url: string;
    try {
      url = await this.source.startSocialLogin("google", robleConfig.socialRedirectMobile);
    } catch (e) {
      // Un destino que la consola no conoce: Roble responde 400/404.
      if (e instanceof RobleApiHttpException && [400, 404, 422].includes(e.statusCode)) throw failure(MOBILE_GOOGLE_PENDING);
      throw translateRobleError(e, failure);
    }
    const back = await SocialBrowser.openAuthSession(url);
    if (!back) return null;
    return this.finishSocial(back);
  }

  async completeGoogleSignIn(): Promise<AuthUser | null> {
    if (this.socialCodeRead) return null;
    this.socialCodeRead = true;
    const back = SocialBrowser.readReturn();
    if (!back.code && !back.error) return null;
    SocialBrowser.dropQuery();
    return this.finishSocial(back);
  }

  private async finishSocial({ code, error, errorDescription }: SocialReturn): Promise<AuthUser> {
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

// Roble responde 403 (o un 401 que lo dice) a quien no confirmó el correo.
function isUnverified(e: unknown): boolean {
  if (!(e instanceof RobleApiHttpException)) return false;
  const text = (e.message ?? "").toLowerCase();
  return (e.statusCode === 403 || e.statusCode === 401) && (text.includes("verif") || text.includes("confirm"));
}

// El correo trae un código o un enlace con `?token=`: sirven los dos.
export function tokenFrom(input: string): string {
  const text = input.trim();
  const match = text.match(/[?&#](?:token|code)=([^&#\s]+)/i);
  return match ? decodeURIComponent(match[1]) : text.replace(/\s/g, "");
}

function isEmail(email: string): boolean {
  const value = email.trim();
  return value.length > 4 && value.includes("@") && value.includes(".") && !value.includes(" ");
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
