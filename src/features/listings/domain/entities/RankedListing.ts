import { Listing } from "./Listing";
import { ListingStats, scoreOf } from "./ListingStats";

export type RankedListing = { position: number; listing: Listing; stats: ListingStats };

// Por puntaje; empatan los comentarios, luego las vistas y al final el título.
export function compareRanked(a: { listing: Listing; stats: ListingStats }, b: { listing: Listing; stats: ListingStats }): number {
  const byScore = scoreOf(b.stats) - scoreOf(a.stats);
  if (byScore !== 0) return byScore;
  const byComments = b.stats.comments - a.stats.comments;
  if (byComments !== 0) return byComments;
  const byViews = b.stats.views - a.stats.views;
  if (byViews !== 0) return byViews;
  return a.listing.title.toLowerCase().localeCompare(b.listing.title.toLowerCase());
}

export function rank(listings: Listing[], stats: Record<string, ListingStats>, empty: ListingStats): RankedListing[] {
  return listings
    .map((listing) => ({ listing, stats: stats[listing.id] ?? empty }))
    .sort(compareRanked)
    .map((entry, index) => ({ position: index + 1, ...entry }));
}
