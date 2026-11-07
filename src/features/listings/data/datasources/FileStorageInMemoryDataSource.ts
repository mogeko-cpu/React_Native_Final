import { RobleApiHttpException } from "roble-client";

import { DummyData } from "@/src/core/data/dummyData";
import { newId } from "@/src/core/data/LocalTables";
import { FileStorageDataSource } from "./FileStorageDataSource";

export class FileStorageInMemoryDataSource implements FileStorageDataSource {
  constructor(private readonly data: DummyData) {}

  async upload(p: { fileName: string; data: ArrayBuffer }) {
    await this.data.tables.wait();
    const id = newId();
    this.data.files.set(id, { name: p.fileName, size: p.data.byteLength, uploaderId: this.data.sessionUserId ?? "" });
    return id;
  }

  async downloadUrl(storageId: string) {
    const file = this.data.files.get(storageId);
    if (!file) throw new RobleApiHttpException(404, "El archivo no existe.");
    return `https://example.com/local-files/${encodeURIComponent(file.name)}`;
  }

  async delete(storageId: string) {
    if (!this.data.files.delete(storageId)) throw new RobleApiHttpException(404, "El archivo no existe.");
  }
}
