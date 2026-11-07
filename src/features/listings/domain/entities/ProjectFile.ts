// La ficha de algo que el equipo compartió (`project_file.dart`): `file` (los
// bytes están en el bucket y `storageId` es su id) o `link` (un enlace a Drive,
// GitHub, Figma; `url` es la dirección).
export type ProjectFileKind = "file" | "link";

export type ProjectFile = {
  id: string;
  listingId: string;
  name: string;
  kind: ProjectFileKind;
  storageId: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  uploaderName: string;
  createdAt: Date;
};

export const isLink = (file: ProjectFile) => file.kind === "link";

export function extensionOf(file: ProjectFile): string {
  if (isLink(file)) return "";
  const dot = file.name.lastIndexOf(".");
  return dot === -1 || dot === file.name.length - 1 ? "" : file.name.substring(dot + 1).toLowerCase();
}
