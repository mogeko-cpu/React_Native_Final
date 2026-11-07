import {
  RobleApiAuthException,
  RobleApiException,
  RobleApiHttpException,
  RobleApiNetworkException,
  RobleApiTimeoutException,
} from "roble-client";

// Una fila tal como la devuelve Roble.
export type Row = Record<string, any>;

// Aquí mueren las excepciones del paquete: cada repositorio las traduce al
// `Failure` de su feature, para que la pantalla no vea nunca un código HTTP.
// Los textos son los mismos de `roble_exception.dart` en la versión Flutter.
export async function guardRoble<T>(
  action: () => Promise<T>,
  toFailure: (message: string) => Error,
  options: { notFound?: string } = {},
): Promise<T> {
  try {
    return await action();
  } catch (e) {
    throw translateRobleError(e, toFailure, options);
  }
}

export function translateRobleError(
  e: unknown,
  toFailure: (message: string) => Error,
  options: { notFound?: string } = {},
): unknown {
  if (e instanceof RobleApiNetworkException) return toFailure("No hay conexión con ROBLE. Revisa tu internet.");
  if (e instanceof RobleApiTimeoutException) return toFailure("ROBLE tardó demasiado en responder. Intenta de nuevo.");
  if (e instanceof RobleApiAuthException) return toFailure("Tu sesión expiró. Vuelve a iniciar sesión.");
  if (e instanceof RobleApiHttpException) {
    const detail = cleanDetail(e.message);
    switch (e.statusCode) {
      case 400:
        return toFailure(detail ?? "ROBLE rechazó los datos enviados. Revisa que las columnas de la tabla coincidan con la aplicación.");
      case 401:
        return toFailure("Tu sesión expiró. Vuelve a iniciar sesión.");
      case 403:
        return toFailure(detail ?? "Tu cuenta no tiene permiso para esta operación.");
      case 404:
        return toFailure(options.notFound ?? detail ?? "El registro no existe.");
      case 429:
        return toFailure("Demasiadas solicitudes a ROBLE. Espera un momento.");
      default:
        if (e.statusCode >= 500) {
          return toFailure(detail ? `ROBLE respondió con un error (${e.statusCode}): ${detail}` : `ROBLE respondió con un error (${e.statusCode}).`);
        }
        return toFailure(detail ?? `Respuesta inesperada de ROBLE (${e.statusCode}).`);
    }
  }
  if (e instanceof RobleApiException) return toFailure(e.message);
  return e;
}

function cleanDetail(message: string | undefined): string | null {
  const text = (message ?? "").trim();
  return text && !text.startsWith("<") ? text : null;
}

// Si el error es una violación de `UNIQUE`. ROBLE reenvía el mensaje de
// PostgreSQL sin código propio y el estado puede ser 400, 409 o 500, así que
// se lee el texto (`roble_duplicate.dart`).
export function isDuplicateRow(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const message = e.message.toLowerCase();
  return (
    message.includes("duplicate") ||
    message.includes("unique") ||
    message.includes("llave duplicada") ||
    message.includes("23505")
  );
}

// Un 404 al borrar algo que ya no estaba: el borrado ya ocurrió.
export function isNotFound(e: unknown): boolean {
  return e instanceof RobleApiHttpException && e.statusCode === 404;
}

// `_id` es `uuid`: compararlo con algo que no lo sea falla **dentro** de
// PostgreSQL y ROBLE responde 500. Un id mal formado se trata como «no existe»
// y no llega a salir la petición.
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export function isRowId(value: string | null | undefined): boolean {
  return !!value && UUID.test(value);
}

// ── Lectura de columnas ────────────────────────────────────

export function str(value: unknown, fallback = ""): string {
  return value == null ? fallback : String(value);
}

export function parseDate(value: unknown, fallback = new Date(0)): Date {
  if (value == null || value === "") return fallback;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export function intOf(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

// `required_skills` es `jsonb`, pero filas viejas lo traen como texto.
export function stringsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (!trimmed.startsWith("[")) return [trimmed];
    try {
      const decoded = JSON.parse(trimmed);
      if (Array.isArray(decoded)) return decoded.map((item) => String(item));
    } catch {
      // Ni lista ni texto útil: sin habilidades.
    }
  }
  return [];
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function byDateDesc(column: string) {
  return (a: Row, b: Row) => parseDate(b[column]).getTime() - parseDate(a[column]).getTime();
}

export function byDateAsc(column: string) {
  return (a: Row, b: Row) => parseDate(a[column]).getTime() - parseDate(b[column]).getTime();
}
