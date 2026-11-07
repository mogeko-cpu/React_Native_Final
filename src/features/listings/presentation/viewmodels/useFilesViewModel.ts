import { useCallback, useEffect, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { FilePicker, PickedFile } from "@/src/core/platform/FilePicker";
import { LinkOpener } from "@/src/core/platform/LinkOpener";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { Listing, roleOf } from "../../domain/entities/Listing";
import { isLink, ProjectFile } from "../../domain/entities/ProjectFile";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { ProjectFileRepository } from "../../domain/repositories/ProjectFileRepository";

// La carpeta del equipo (`files_view_model.dart`).
export function useFilesViewModel(listingId: string) {
  const filesRepo = useInject<ProjectFileRepository>(TOKENS.ProjectFileRepo);
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const picker = useInject<FilePicker>(TOKENS.FilePicker);
  const links = useInject<LinkOpener>(TOKENS.LinkOpener);
  const user = useCurrentUser();

  const [listing, setListing] = useState<Listing | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isWorking, setWorking] = useState(false);
  const working = useRef(false);
  // El nombre de lo que se está subiendo, para la barra de progreso.
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastActionError = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await listings.getListingById(listingId);
      if (!found) {
        setError("Proyecto no encontrado");
        return;
      }
      if (roleOf(found, user.id) == null) {
        setError("Solo el equipo del proyecto puede ver sus archivos.");
        return;
      }
      setListing(found);
      setFiles(await filesRepo.getFiles(listingId));
    } catch (e) {
      setError(messageOf(e, "No se pudieron cargar los archivos"));
    } finally {
      setLoading(false);
    }
  }, [listings, filesRepo, listingId, user.id]);

  useEffect(() => {
    // Cargar al abrir: el estado cambia después del `await`, no al instante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const run = async (action: () => Promise<void>, fallback: string): Promise<boolean> => {
    if (working.current) return false;
    working.current = true;
    setWorking(true);
    lastActionError.current = null;
    try {
      await action();
      return true;
    } catch (e) {
      lastActionError.current = messageOf(e, fallback);
      return false;
    } finally {
      working.current = false;
      setWorking(false);
    }
  };

  // `null` si la persona cerró el selector sin elegir nada.
  const upload = async (): Promise<boolean | null> => {
    if (working.current) return false;
    let picked: PickedFile | null;
    try {
      picked = await picker.pickFile();
    } catch (e) {
      lastActionError.current = messageOf(e, "No se pudo abrir el selector de archivos");
      return false;
    }
    if (!picked) return null;
    const file = picked;
    setUploading(file.name);
    try {
      return await run(async () => {
        const stored = await filesRepo.uploadFile({ listingId, uploaderId: user.id, uploaderName: user.name, file });
        setFiles((list) => [stored, ...list]);
      }, "No se pudo subir el archivo");
    } finally {
      setUploading(null);
    }
  };

  const addLink = (form: { name: string; url: string }) =>
    run(async () => {
      const stored = await filesRepo.addLink({ listingId, uploaderId: user.id, uploaderName: user.name, name: form.name, url: form.url });
      setFiles((list) => [stored, ...list]);
    }, "No se pudo guardar el enlace");

  const open = async (file: ProjectFile): Promise<boolean> => {
    lastActionError.current = null;
    try {
      const opened = await links.open(await filesRepo.urlToOpen(file));
      if (!opened) lastActionError.current = `Este dispositivo no pudo abrir "${file.name}".`;
      return opened;
    } catch (e) {
      lastActionError.current = messageOf(e, "No se pudo abrir el archivo");
      return false;
    }
  };

  const remove = (file: ProjectFile) =>
    run(async () => {
      await filesRepo.deleteFile({ fileId: file.id, actorId: user.id });
      setFiles((list) => list.filter((f) => f.id !== file.id));
    }, "No se pudo eliminar el archivo");

  return {
    listing,
    files,
    isLoading,
    isWorking,
    uploading,
    error,
    lastActionError: () => lastActionError.current,
    load,
    canDelete: (file: ProjectFile) => file.uploaderId === user.id,
    uploadCount: files.filter((f) => !isLink(f)).length,
    linkCount: files.filter(isLink).length,
    upload,
    addLink,
    open,
    remove,
  };
}
