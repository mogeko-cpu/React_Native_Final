// El bucket del proyecto (`i_file_storage.dart`): sube bytes, da una URL
// firmada para abrirlos y los borra. Solo quien subió algo puede borrarlo.
export interface FileStorageDataSource {
  upload(p: { fileName: string; data: ArrayBuffer; mimeType?: string; folder?: string }): Promise<string>;
  downloadUrl(storageId: string): Promise<string>;
  delete(storageId: string): Promise<void>;
}
