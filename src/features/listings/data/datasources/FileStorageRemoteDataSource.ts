import { RobleClient } from "@/src/core/roble/RobleClient";
import { FileStorageDataSource } from "./FileStorageDataSource";

// Subir son tres llamadas que hace `roble-client`: pedir la URL firmada, `PUT`
// directo al bucket y confirmar.
export class FileStorageRemoteDataSource implements FileStorageDataSource {
  constructor(private readonly client: RobleClient) {}

  upload(p: { fileName: string; data: ArrayBuffer; mimeType?: string; folder?: string }) {
    return this.client.upload(p);
  }

  downloadUrl(storageId: string) {
    return this.client.downloadUrl(storageId);
  }

  delete(storageId: string) {
    return this.client.removeFile(storageId);
  }
}
