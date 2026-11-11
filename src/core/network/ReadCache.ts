import AsyncStorage from "@react-native-async-storage/async-storage";

import { Row } from "../roble/guard";

const PREFIX = "roble.cache.";

// La última respuesta de cada lectura (tabla + filtros), para mostrar algo sin
// conexión. Vive en memoria y en AsyncStorage, así que también sirve al abrir
// la app sin red. Solo se escribe al disco cuando la respuesta cambió: las
// pantallas que se refrescan solas leen lo mismo una y otra vez.
export class ReadCache {
  private readonly memory = new Map<string, string>();

  constructor(private readonly scope: string) {}

  key(table: string, filters?: Record<string, string>) {
    const sorted = Object.entries(filters ?? {}).sort(([a], [b]) => a.localeCompare(b));
    return `${PREFIX}${this.scope}.${table}?${new URLSearchParams(sorted).toString()}`;
  }

  async put(key: string, rows: Row[]) {
    const json = JSON.stringify(rows);
    if (this.memory.get(key) === json) return;
    this.memory.set(key, json);
    await AsyncStorage.setItem(key, json).catch(() => undefined);
  }

  async get(key: string): Promise<Row[] | null> {
    const json = this.memory.get(key) ?? (await AsyncStorage.getItem(key).catch(() => null));
    if (!json) return null;
    try {
      return JSON.parse(json) as Row[];
    } catch {
      return null;
    }
  }

  // Al cerrar sesión: lo guardado era de esa persona.
  async clear() {
    this.memory.clear();
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(`${PREFIX}${this.scope}.`));
      if (keys.length > 0) await AsyncStorage.multiRemove(keys);
    } catch {
      // Lo que quede se sobrescribe con la siguiente lectura.
    }
  }
}
