import { skillKey } from "@/src/features/users/domain/skills";
import { isRecruiting, Listing } from "./entities/Listing";

export type Recommendation = {
  listing: Listing;
  // Las habilidades del proyecto que la persona tiene, como las pide el proyecto.
  matched: string[];
};

export const MAX_RECOMMENDATIONS = 5;

// «Recomendados para ti»: proyectos que buscan gente, donde la persona no está,
// y que piden al menos una de sus habilidades. Primero los que coinciden en
// más habilidades; a igualdad, el que más cupos tiene libres y después el más
// reciente (la lista llega ordenada por fecha).
export function recommendListings(listings: Listing[], skills: string[], userId: string, limit = MAX_RECOMMENDATIONS): Recommendation[] {
  const mine = new Set(skills.map(skillKey).filter(Boolean));
  if (mine.size === 0) return [];
  return listings
    .filter((l) => isRecruiting(l) && !l.memberIds.includes(userId))
    .map((listing, index) => ({ listing, index, matched: listing.requiredSkills.filter((s) => mine.has(skillKey(s))) }))
    .filter((r) => r.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length || freeSlots(b.listing) - freeSlots(a.listing) || a.index - b.index)
    .slice(0, limit)
    .map(({ listing, matched }) => ({ listing, matched }));
}

function freeSlots(listing: Listing) {
  return listing.maxMembers - listing.memberIds.length;
}
