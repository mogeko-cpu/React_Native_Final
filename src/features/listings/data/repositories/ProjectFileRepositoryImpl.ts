import { byDateDesc, guardRoble, intOf, isNotFound, isRowId, nowIso, parseDate, Row, str, translateRobleError } from "@/src/core/roble/guard";
import { PickedFile } from "@/src/core/platform/FilePicker";
import { readableSize } from "@/src/core/utils/formatters";
import { roleOf } from "../../domain/entities/Listing";
import { isLink, ProjectFile } from "../../domain/entities/ProjectFile";
import { ListingFailure } from "../../domain/ListingFailure";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { MAX_FILE_BYTES, MAX_FILE_NAME, ProjectFileRepository } from "../../domain/repositories/ProjectFileRepository";
import { FileStorageDataSource } from "../datasources/FileStorageDataSource";
import { ProjectFileDataSource } from "../datasources/ProjectFileDataSource";

const failure = (message: string) => new ListingFailure(message);

// Los archivos del equipo (`project_file_repository.dart`). Subir son dos cosas
// en dos servicios: los bytes al bucket y la ficha en `project_files`. Primero
// los bytes; si falla la ficha, los bytes se borran de nuevo.
export class ProjectFileRepositoryImpl implements ProjectFileRepository {
  constructor(
    private readonly source: ProjectFileDataSource,
    private readonly storage: FileStorageDataSource,
    private readonly listings: ListingRepository,
  ) {}

  private q<T>(action: () => Promise<T>): Promise<T> {
    return guardRoble(action, failure);
  }

  async getFiles(listingId: string): Promise<ProjectFile[]> {
    if (!isRowId(listingId)) return [];
    const rows = await this.q(() => this.source.readFiles({ listing_id: listingId }));
    return rows.sort(byDateDesc("created_at")).map(toFile).filter((f): f is ProjectFile => f != null);
  }

  async uploadFile({ listingId, uploaderId, uploaderName, file }: { listingId: string; uploaderId: string; uploaderName: string; file: PickedFile }) {
    const name = file.name.trim();
    if (!name) throw failure("El archivo no tiene nombre.");
    if (file.sizeBytes === 0) throw failure("El archivo está vacío.");
    if (file.sizeBytes > MAX_FILE_BYTES) {
      throw failure(`El archivo pesa ${readableSize(file.sizeBytes)} y el máximo es ${readableSize(MAX_FILE_BYTES)}. Para algo más grande, comparte un enlace.`);
    }
    await this.requireTeam(listingId, uploaderId, "subir archivos");
    const mimeType = file.mimeType ?? undefined;
    const storageId = await this.q(() => this.storage.upload({ fileName: name, data: file.data, mimeType, folder: `proyectos/${listingId}` }));
    try {
      return await this.insert({
        listingId,
        name,
        kind: "file",
        storageId,
        url: "",
        mimeType: mimeType ?? "",
        sizeBytes: file.sizeBytes,
        uploaderId,
        uploaderName,
      });
    } catch (e) {
      await this.storage.delete(storageId).catch(() => undefined);
      throw e;
    }
  }

  async addLink({ listingId, uploaderId, uploaderName, name, url }: { listingId: string; uploaderId: string; uploaderName: string; name: string; url: string }) {
    const cleanName = name.trim();
    if (!cleanName) throw failure("Ponle un nombre al enlace.");
    if (cleanName.length > MAX_FILE_NAME) throw failure(`El nombre es muy largo. Máximo ${MAX_FILE_NAME} caracteres.`);
    const address = normalizeUrl(url);
    if (!address) throw failure("Escribe un enlace válido, por ejemplo https://drive.google.com/…");
    await this.requireTeam(listingId, uploaderId, "compartir enlaces");
    return this.insert({ listingId, name: cleanName, kind: "link", storageId: "", url: address, mimeType: "", sizeBytes: 0, uploaderId, uploaderName });
  }

  // El enlace de descarga vence en pocos minutos: por eso no se guarda en la
  // base y se pide en el momento de abrir.
  async urlToOpen(file: ProjectFile): Promise<string> {
    if (isLink(file)) return file.url;
    if (!file.storageId) throw failure("Este archivo no tiene contenido.");
    return this.q(() => this.storage.downloadUrl(file.storageId));
  }

  // Al revés que subir: primero los bytes, después la ficha. Si se corta a la
  // mitad, borrarlo otra vez termina el trabajo.
  async deleteFile({ fileId, actorId }: { fileId: string; actorId: string }) {
    const rows = isRowId(fileId) ? await this.q(() => this.source.readFiles({ _id: fileId })) : [];
    const file = rows.length > 0 ? toFile(rows[0]) : null;
    if (!file) throw failure("Este archivo ya no existe.");
    if (file.uploaderId !== actorId) throw failure("Solo quien compartió el archivo puede eliminarlo.");
    if (!isLink(file) && file.storageId) {
      try {
        await this.storage.delete(file.storageId);
      } catch (e) {
        // Un archivo que ya no está en el bucket cuenta como borrado.
        if (!isNotFound(e)) throw translateRobleError(e, failure);
      }
    }
    await this.q(() => this.source.deleteFile(fileId));
  }

  // De los bytes solo se pueden borrar los que subió quien elimina; los demás
  // quedan en el bucket sin ninguna ficha que los muestre.
  async purgeListing(listingId: string, actorId: string) {
    for (const file of await this.getFiles(listingId)) {
      if (!isLink(file) && file.storageId && file.uploaderId === actorId) {
        await this.storage.delete(file.storageId).catch(() => undefined);
      }
      await this.q(() => this.source.deleteFile(file.id));
    }
  }

  private async insert(file: Omit<ProjectFile, "id" | "createdAt">): Promise<ProjectFile> {
    const createdAt = new Date();
    const row = await this.q(() =>
      this.source.insertFile({
        listing_id: file.listingId,
        name: file.name,
        kind: file.kind,
        storage_id: file.storageId,
        url: file.url,
        mime_type: file.mimeType,
        size_bytes: file.sizeBytes,
        uploader_id: file.uploaderId,
        uploader_name: file.uploaderName,
        created_at: createdAt.toISOString() || nowIso(),
      }),
    );
    const id = str(row._id);
    if (!id) throw failure("ROBLE guardó el archivo pero no devolvió su identificador. Actualiza la lista antes de volver a subirlo.");
    return { ...file, id, createdAt };
  }

  private async requireTeam(listingId: string, userId: string, action: string) {
    const listing = await this.listings.getListingById(listingId);
    if (!listing) throw failure("Este proyecto ya no existe.");
    if (roleOf(listing, userId) == null) throw failure(`Solo el equipo del proyecto puede ${action}.`);
  }
}

// `drive.google.com/…` → `https://drive.google.com/…`. Nada con espacios, sin
// punto en el host ni con `usuario:clave@`, que es como una credencial termina
// en una lista compartida.
export function normalizeUrl(input: string): string | null {
  let text = input.trim();
  if (!text || text.includes(" ")) return null;
  if (!text.includes("://")) text = `https://${text}`;
  const match = /^(https?):\/\/([^/?#]*)(.*)$/i.exec(text);
  if (!match) return null;
  const [, , authority, rest] = match;
  if (authority.includes("@")) return null;
  const host = authority.split(":")[0];
  if (!host || !host.includes(".")) return null;
  return `${match[1].toLowerCase()}://${authority}${rest}`;
}

function toFile(row: Row): ProjectFile | null {
  const id = str(row._id);
  const listingId = str(row.listing_id);
  if (!id || !listingId) return null;
  return {
    id,
    listingId,
    name: str(row.name, "Archivo"),
    kind: row.kind === "link" ? "link" : "file",
    storageId: str(row.storage_id),
    url: str(row.url),
    mimeType: str(row.mime_type),
    sizeBytes: intOf(row.size_bytes, 0),
    uploaderId: str(row.uploader_id),
    uploaderName: str(row.uploader_name, "Integrante"),
    createdAt: parseDate(row.created_at),
  };
}
