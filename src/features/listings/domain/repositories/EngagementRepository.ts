import { ListingComment } from "../entities/ListingComment";
import { ListingStats, ReactionType } from "../entities/ListingStats";

// Valoraciones, vistas y comentarios (`i_engagement_repository.dart`).
export interface EngagementRepository {
  // Los contadores de todos los proyectos, con lo que votó `userId`.
  getStats(userId: string): Promise<Record<string, ListingStats>>;
  getStatsFor(listingId: string, userId: string): Promise<ListingStats>;
  // Tocar el voto que ya tenías lo quita; tocar el otro lo reemplaza.
  toggleReaction(p: { listingId: string; groupId: string; userId: string; reaction: ReactionType; current: ReactionType | null }): Promise<void>;
  // Una vista por persona: volver a abrir no suma.
  registerView(p: { listingId: string; groupId: string; userId: string }): Promise<void>;
  getComments(listingId: string): Promise<ListingComment[]>;
  addComment(draft: Omit<ListingComment, "id" | "createdAt">): Promise<ListingComment>;
  deleteComment(commentId: string): Promise<void>;
  // Borra todo lo del proyecto, antes que el proyecto (no hay cascadas).
  purgeListing(listingId: string): Promise<void>;
}
