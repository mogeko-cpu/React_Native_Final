import { RobleApiHttpException } from "roble-client";

import { Row } from "../roble/guard";

// Un Roble de mentira, en memoria: tablas, `_id` uuid y **los mismos `UNIQUE`
// compuestos** del esquema real (`docs/roble.md`). Es la razón de existir de
// este doble: así se puede probar qué pasa en el segundo `INSERT`, que es
// justo lo que ROBLE no deja revisar antes.
//
// Lo usan los datasources `…InMemoryDataSource`, que son los que arman la app
// sin servidor (`EXPO_PUBLIC_DATA_SOURCE=local`) y las pruebas.
const UNIQUE: Record<string, string[][]> = {
  listing_members: [["listing_id", "user_id"]],
  join_requests: [["listing_id", "applicant_id"]],
  group_members: [["group_id", "user_id"]],
  group_requests: [["group_id", "applicant_id"]],
  listing_reactions: [["listing_id", "user_id"]],
  listing_views: [["listing_id", "user_id"]],
  app_users: [["user_id"]],
  group_invitations: [["group_id", "invitee_id"]],
  mentorship_requests: [["listing_id"]],
};

export function newId(): string {
  // Un uuid v4 sin dependencias: basta con que tenga la forma que Roble valida.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export class LocalTables {
  private readonly tables = new Map<string, Row[]>();

  // Una lectura con filtros de igualdad, que es lo único que `read` admite.
  read(table: string, filters: Record<string, unknown> = {}): Row[] {
    const rows = this.tables.get(table) ?? [];
    return rows
      .filter((row) => Object.entries(filters).every(([key, value]) => String(row[key] ?? "") === String(value)))
      .map((row) => ({ ...row }));
  }

  insert(table: string, record: Row): Row {
    const row: Row = { ...record, _id: record._id ?? newId() };
    for (const columns of UNIQUE[table] ?? []) {
      const clash = (this.tables.get(table) ?? []).some((existing) => columns.every((c) => String(existing[c]) === String(row[c])));
      if (clash) {
        throw new RobleApiHttpException(
          500,
          `duplicate key value violates unique constraint "${table}_${columns.join("_")}_key" (23505)`,
        );
      }
    }
    if (!this.tables.has(table)) this.tables.set(table, []);
    this.tables.get(table)!.push(row);
    return { ...row };
  }

  insertMany(table: string, records: Row[]): void {
    for (const record of records) this.insert(table, record);
  }

  update(table: string, id: string, changes: Row): void {
    const row = (this.tables.get(table) ?? []).find((r) => r._id === id);
    if (!row) throw new RobleApiHttpException(404, "El registro no existe.");
    const { _id, ...clean } = changes;
    Object.assign(row, clean);
  }

  delete(table: string, id: string): void {
    const rows = this.tables.get(table) ?? [];
    const index = rows.findIndex((r) => r._id === id);
    if (index === -1) throw new RobleApiHttpException(404, "El registro no existe.");
    rows.splice(index, 1);
  }

  // Un poco de latencia, para que la app en memoria se sienta como la real
  // (indicadores de carga incluidos) sin hacer esperar a las pruebas.
  static delay = 0;
  async wait() {
    if (LocalTables.delay > 0) await new Promise((resolve) => setTimeout(resolve, LocalTables.delay));
  }
}
