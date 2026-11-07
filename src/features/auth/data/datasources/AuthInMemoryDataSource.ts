import { RobleApiHttpException } from "roble-client";

import { DummyData } from "@/src/core/data/dummyData";
import { newId } from "@/src/core/data/LocalTables";
import { Row } from "@/src/core/roble/guard";
import { AuthDataSource } from "./AuthDataSource";

// Las cuentas en memoria: lo mismo que Roble responde, sin red.
export class AuthInMemoryDataSource implements AuthDataSource {
  constructor(private readonly data: DummyData) {}

  async restoreSession() {
    return this.data.sessionUserId != null;
  }

  async restoreOffline() {
    return this.data.sessionUserId != null;
  }

  async currentUser() {
    const account = this.data.accounts.find((a) => a.userId === this.data.sessionUserId);
    if (!account) throw new RobleApiHttpException(401, "No hay sesión.");
    return this.profileOf(account);
  }

  async cachedUser() {
    return null;
  }

  async login(email: string, password: string) {
    await this.data.tables.wait();
    const account = this.data.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account || account.password !== password) throw new RobleApiHttpException(401, "Credenciales inválidas");
    this.data.sessionUserId = account.userId;
    return this.profileOf(account);
  }

  async signUp(name: string, email: string, password: string) {
    await this.data.tables.wait();
    if (this.data.accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      throw new RobleApiHttpException(400, "Ya existe una cuenta con ese correo.");
    }
    this.data.accounts.push({ userId: newId(), name, email, password });
  }

  async startSocialLogin(): Promise<string> {
    throw new RobleApiHttpException(400, "El inicio con Google no existe en la app sin servidor.");
  }

  async exchangeSocialCode(): Promise<Row> {
    throw new RobleApiHttpException(400, "Código inválido o expirado");
  }

  async logout() {
    this.data.sessionUserId = null;
  }

  onSessionExpired() {
    return () => {};
  }

  private profileOf(account: { userId: string; name: string; email: string }): Row {
    return { userId: account.userId, name: account.name, email: account.email };
  }
}
