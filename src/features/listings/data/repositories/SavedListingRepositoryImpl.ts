import { byDateDesc, guardRoble, isDuplicateRow, nowIso, str, translateRobleError } from "@/src/core/roble/guard";
import { ListingFailure } from "../../domain/ListingFailure";
import { Listing } from "../../domain/entities/Listing";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { SavedListingRepository } from "../../domain/repositories/SavedListingRepository";
import { SavedListingDataSource } from "../datasources/SavedListingDataSource";

const failure = (message: string) => new ListingFailure(message);
const MISSING_TABLE = "Falta la tabla saved_listings en Roble: córrela desde docs/sql/2026_habilidades_y_guardados.sql.";

export class SavedListingRepositoryImpl implements SavedListingRepository {
  constructor(
    private readonly source: SavedListingDataSource,
    private readonly listings: ListingRepository,
  ) {}

  async getSavedIds(userId: string): Promise<string[]> {
    const rows = await guardRoble(() => this.source.readSaved({ user_id: userId }), failure, { notFound: MISSING_TABLE });
    return rows.sort(byDateDesc("saved_at")).map((r) => str(r.listing_id)).filter(Boolean);
  }

  async getSavedListings(userId: string): Promise<Listing[]> {
    const ids = await this.getSavedIds(userId);
    if (ids.length === 0) return [];
    const byId = new Map((await this.listings.getListings()).map((l) => [l.id, l]));
    // Sin llaves foráneas, un guardado puede apuntar a un proyecto borrado.
    return ids.map((id) => byId.get(id)).filter((l): l is Listing => l != null);
  }

  async save(userId: string, listingId: string): Promise<void> {
    try {
      await this.source.insertSaved({ user_id: userId, listing_id: listingId, saved_at: nowIso() });
    } catch (e) {
      // El `UNIQUE (user_id, listing_id)` dice que ya estaba guardado.
      if (isDuplicateRow(e)) return;
      throw translateRobleError(e, failure, { notFound: MISSING_TABLE });
    }
  }

  async unsave(userId: string, listingId: string): Promise<void> {
    const rows = await guardRoble(() => this.source.readSaved({ user_id: userId, listing_id: listingId }), failure, { notFound: MISSING_TABLE });
    for (const row of rows) {
      const id = str(row._id);
      if (id) await guardRoble(() => this.source.deleteSaved(id), failure);
    }
  }
}
