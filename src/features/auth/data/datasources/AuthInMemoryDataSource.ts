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
    if (account.verified === false) throw new RobleApiHttpException(403, "Email not verified");
    this.data.sessionUserId = account.userId;
    return this.profileOf(account);
  }

  async signUp(name: string, email: string, password: string) {
    await this.data.tables.wait();
    if (this.data.accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      throw new RobleApiHttpException(400, "Ya existe una cuenta con ese correo.");
    }
    this.data.accounts.push({ userId: newId(), name, email, password, verified: false });
  }

  async verifyEmail(email: string, code: string) {
    await this.data.tables.wait();
    const account = this.find(email);
    if (!account) throw new RobleApiHttpException(404, "No existe una cuenta con ese correo.");
    if (code !== DummyData.demoCode) throw new RobleApiHttpException(400, "Código inválido o expirado");
    account.verified = true;
  }

  async resendCode(email: string) {
    await this.data.tables.wait();
    if (!this.find(email)) throw new RobleApiHttpException(404, "No existe una cuenta con ese correo.");
  }

  async forgotPassword(email: string) {
    await this.data.tables.wait();
    // Como Roble: no dice si el correo existe, para no revelar cuentas.
    if (this.find(email)) this.data.resetRequests.add(email.toLowerCase());
  }

  async resetPassword(token: string, newPassword: string) {
    await this.data.tables.wait();
    const email = [...this.data.resetRequests][0];
    if (token !== DummyData.demoCode || !email) throw new RobleApiHttpException(400, "Código inválido o expirado");
    const account = this.find(email);
    if (account) account.password = newPassword;
    this.data.resetRequests.delete(email);
  }

  private find(email: string) {
    return this.data.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  }

  async startSocialLogin(): Promise<string> {
    // Igual que Roble con un destino que no está registrado.
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
