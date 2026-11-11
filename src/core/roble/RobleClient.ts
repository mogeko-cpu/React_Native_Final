import AsyncStorage from "@react-native-async-storage/async-storage";
import { RobleApiClient, RobleApiHttpException, RobleApiNetworkException, RobleApiTimeoutException } from "roble-client";

import { connectivity } from "../network/connectivity";
import { ReadCache } from "../network/ReadCache";
import { UserFacingError } from "../utils/failure";
import { Row } from "./guard";

// Lo que se responde a una escritura sin conexión: no se encola nada, porque
// Roble no tiene transacciones y reenviar más tarde podría chocar con lo que
// otra persona hizo mientras tanto.
export const OFFLINE_WRITE = "Sin conexión: lo que ves es lo último guardado. Podrás hacer cambios cuando vuelva el internet.";

const isNetworkError = (e: unknown) => e instanceof RobleApiNetworkException || e instanceof RobleApiTimeoutException;

// El cliente de Roble, uno solo para toda la app.
//
// Se crea una vez (en `appContainer.ts`) y se comparte: uno por pantalla le
// daría a cada copia su propia sesión. Solo lo usan los datasources.
//
// `roble-client` ya hace lo que en Flutter hacía `roble_client.dart` a mano:
// pone el `Bearer`, renueva el token una vez ante un 401 y guarda la sesión
// (aquí en AsyncStorage, que es lo que hay en React Native).
export class RobleClient {
  readonly db: RobleApiClient;
  private readonly cache: ReadCache;

  constructor(
    private readonly config: { baseUrl: string; contractId: string },
    db?: RobleApiClient,
  ) {
    this.db = db ?? new RobleApiClient({ baseUrl: config.baseUrl, contractId: config.contractId, storage: AsyncStorage });
    this.cache = new ReadCache(config.contractId);
  }

  // ── Base de datos ─────────────────────────────────────────
  //
  // Sin conexión, cada lectura devuelve lo último que respondió Roble para esa
  // misma tabla y filtros, y las escrituras se rechazan con un mensaje claro.

  async read(table: string, filters?: Record<string, string>): Promise<Row[]> {
    const key = this.cache.key(table, filters);
    try {
      const rows = await this.db.read(table, filters);
      connectivity.markOnline();
      this.cache.put(key, rows).catch(() => undefined);
      return rows;
    } catch (e) {
      if (isNetworkError(e)) {
        connectivity.markOffline();
        const cached = await this.cache.get(key);
        if (cached) return cached;
      }
      throw e;
    }
  }

  insert(table: string, row: Row): Promise<Row> {
    return this.write(() => this.db.create(table, row));
  }

  // Varias filas en **una** petición (`insert`, no `insert-one`): con un equipo
  // de diez serían diez peticiones contra un presupuesto de 100 por minuto.
  async insertMany(table: string, rows: Row[]): Promise<void> {
    if (rows.length === 0) return;
    await this.write(() => this.db.createMany(table, rows));
  }

  async update(table: string, id: string, changes: Row): Promise<void> {
    const { _id, id: _ignored, ...clean } = changes;
    await this.write(() => this.db.update(table, id, clean));
  }

  async delete(table: string, id: string): Promise<void> {
    await this.write(() => this.db.delete(table, id));
  }

  clearCache() {
    return this.cache.clear();
  }

  // Se intenta aunque la última lectura haya fallado: si la red ya volvió, la
  // escritura pasa y quita el aviso; si no, falla rápido con el mensaje.
  private async write<T>(action: () => Promise<T>): Promise<T> {
    try {
      const result = await action();
      connectivity.markOnline();
      return result;
    } catch (e) {
      if (isNetworkError(e)) {
        connectivity.markOffline();
        throw new UserFacingError(OFFLINE_WRITE);
      }
      throw e;
    }
  }

  // ── Archivos (bucket S3 del proyecto) ─────────────────────

  async upload(params: { fileName: string; data: ArrayBuffer | Uint8Array | Blob; mimeType?: string; folder?: string }) {
    const { fileId } = await this.write(() => this.db.files.upload(params));
    return fileId;
  }

  async downloadUrl(fileId: string) {
    const { downloadUrl } = await this.db.files.getDownloadUrl(fileId);
    return downloadUrl;
  }

  removeFile(fileId: string) {
    return this.write(() => this.db.files.remove(fileId));
  }

  // ── Inicio de sesión con Google ───────────────────────────
  //
  // Roble hace de intermediario: el `client_secret` vive en su consola, no en
  // la app. Los cuatro pasos están en `docs/roble.md` de la versión Flutter.

  // Paso 1: pide a Roble la URL de Google. `redirect` es el *nombre* de un
  // destino registrado en la consola, nunca una URL.
  async startSocialLogin(provider: string, redirect: string): Promise<{ url: string; state: string }> {
    const json = await this.post(`/auth/${this.config.contractId}/auth/${provider}/start`, { redirect });
    const url = String(json?.url ?? "");
    if (!url) throw new RobleApiHttpException(201, "ROBLE no dijo a dónde enviar el inicio de sesión con el proveedor.");
    return { url, state: String(json?.state ?? "") };
  }

  // Paso 4: cambia el código de un solo uso por la sesión. Se guarda donde el
  // paquete la lee, y se abre por el mismo camino que un login normal.
  async exchangeSocialCode(code: string) {
    const json = await this.post(`/auth/${this.config.contractId}/auth/token`, { code });
    const accessToken = json?.accessToken;
    if (!accessToken) throw new RobleApiHttpException(200, "ROBLE aceptó el inicio de sesión con el proveedor pero no devolvió el token.");
    await AsyncStorage.setItem(
      `roble.session.${this.config.contractId}`,
      JSON.stringify({ accessToken, refreshToken: json?.refreshToken ?? null }),
    );
    await this.db.restoreSession({ verify: false });
    return this.db.currentUser();
  }

  private async post(path: string, body: Row): Promise<Row> {
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!response.ok) {
      const message = Array.isArray(json?.message) ? json.message.join(". ") : (json?.message ?? json?.error ?? text);
      throw new RobleApiHttpException(response.status, String(message || `ROBLE respondió ${response.status}.`));
    }
    return json ?? {};
  }
}
