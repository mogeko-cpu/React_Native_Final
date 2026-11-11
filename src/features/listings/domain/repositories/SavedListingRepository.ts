import { Listing } from "../entities/Listing";

// Guardar un proyecto para volver a él sin buscarlo. Es solo de quien lo
// guarda: nadie más ve la lista ni se entera.
export interface SavedListingRepository {
  // Los ids que guardó, del más reciente al más antiguo.
  getSavedIds(userId: string): Promise<string[]>;
  // Los proyectos guardados que todavía existen (los borrados se ignoran).
  getSavedListings(userId: string): Promise<Listing[]>;
  // Guardar dos veces no hace nada; quitar uno que no estaba, tampoco.
  save(userId: string, listingId: string): Promise<void>;
  unsave(userId: string, listingId: string): Promise<void>;
}
