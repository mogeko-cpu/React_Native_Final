import AsyncStorage from "@react-native-async-storage/async-storage";

import { Row } from "@/src/core/roble/guard";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { AuthDataSource } from "./AuthDataSource";

const USER_KEY = "roble_user";

// Habla con Roble sobre cuentas. No decide nada y deja subir las excepciones.
// El perfil se guarda aparte (como `RobleSession` en Flutter) para poder
// arrancar sin red con el nombre de quien entró.
export class AuthRemoteDataSource implements AuthDataSource {
  constructor(private readonly client: RobleClient) {}

  restoreSession() {
    return this.client.db.restoreSession();
  }

  async restoreOffline() {
    return this.client.db.restoreSession({ verify: false });
  }

  async currentUser() {
    const profile = await this.client.db.currentUser();
    await this.remember(profile);
    return profile;
  }

  async cachedUser() {
    const raw = await AsyncStorage.getItem(USER_KEY).catch(() => null);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Row;
    } catch {
      return null;
    }
  }

  async login(email: string, password: string) {
    const profile = await this.client.db.login({ email, password });
    await this.remember(profile);
    return profile;
  }

  async signUp(name: string, email: string, password: string) {
    // `signup`: Roble manda un código de 6 dígitos y la cuenta espera por él.
    await this.client.db.registerWithVerification({ email, password, name });
  }

  async verifyEmail(email: string, code: string) {
    await this.client.db.verifyEmail({ email, code });
  }

  async resendCode(email: string) {
    await this.client.db.resendCode({ email });
  }

  async forgotPassword(email: string) {
    await this.client.db.forgotPassword({ email });
  }

  async resetPassword(token: string, newPassword: string) {
    await this.client.db.resetPassword({ token, newPassword });
  }

  async startSocialLogin(provider: string, redirect: string) {
    const { url } = await this.client.startSocialLogin(provider, redirect);
    return url;
  }

  async exchangeSocialCode(code: string) {
    const profile = await this.client.exchangeSocialCode(code);
    await this.remember(profile);
    return profile;
  }

  async logout() {
    try {
      await this.client.db.logout();
    } finally {
      await AsyncStorage.removeItem(USER_KEY).catch(() => undefined);
      await this.client.clearCache();
    }
  }

  onSessionExpired(listener: () => void) {
    return this.client.db.onSessionExpired(listener);
  }

  private async remember(profile: Row) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile)).catch(() => undefined);
  }
}
