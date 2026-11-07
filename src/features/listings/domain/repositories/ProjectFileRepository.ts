import { PickedFile } from "@/src/core/platform/FilePicker";
import { ProjectFile } from "../entities/ProjectFile";

// Los archivos y enlaces del equipo (`i_project_file_repository.dart`). Comparte
// el equipo entero; borra solo quien compartió.
export interface ProjectFileRepository {
  getFiles(listingId: string): Promise<ProjectFile[]>;
  uploadFile(p: { listingId: string; uploaderId: string; uploaderName: string; file: PickedFile }): Promise<ProjectFile>;
  addLink(p: { listingId: string; uploaderId: string; uploaderName: string; name: string; url: string }): Promise<ProjectFile>;
  // La dirección para abrirlo: el enlace, o una URL firmada que vence en minutos.
  urlToOpen(file: ProjectFile): Promise<string>;
  deleteFile(p: { fileId: string; actorId: string }): Promise<void>;
  purgeListing(listingId: string, actorId: string): Promise<void>;
}

export const MAX_FILE_NAME = 120;
// El tope es de la app, no del bucket: el archivo se lee entero en memoria.
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
