import { Row } from "../roble/guard";
import { RobleClient } from "../roble/RobleClient";
import { DummyData } from "./dummyData";

// Las cuatro operaciones que ROBLE ofrece sobre una tabla. Los datasources
// remotos y los de memoria se escriben con esto, así cada método es una línea
// y los dos hablan exactamente igual: en filas.
export type TableOps = {
  read(filters?: Record<string, string>): Promise<Row[]>;
  insert(row: Row): Promise<Row>;
  insertMany(rows: Row[]): Promise<void>;
  update(id: string, changes: Row): Promise<void>;
  remove(id: string): Promise<void>;
};

export function remoteTable(client: RobleClient, table: string): TableOps {
  return {
    read: (filters) => client.read(table, filters),
    insert: (row) => client.insert(table, row),
    insertMany: (rows) => client.insertMany(table, rows),
    update: (id, changes) => client.update(table, id, changes),
    remove: (id) => client.delete(table, id),
  };
}

export function localTable(data: DummyData, table: string): TableOps {
  const t = data.tables;
  return {
    read: async (filters) => {
      await t.wait();
      return t.read(table, filters);
    },
    insert: async (row) => {
      await t.wait();
      return t.insert(table, row);
    },
    insertMany: async (rows) => {
      await t.wait();
      t.insertMany(table, rows);
    },
    update: async (id, changes) => {
      await t.wait();
      t.update(table, id, changes);
    },
    remove: async (id) => {
      await t.wait();
      t.delete(table, id);
    },
  };
}
