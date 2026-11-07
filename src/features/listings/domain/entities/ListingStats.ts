// Lo que el campus opinó de un proyecto (`listing_stats.dart`). Los contadores
// son filas, no columnas: contar filas no se puede desincronizar.
export type ReactionType = "like" | "dislike";

export const reactionValue = (reaction: ReactionType) => (reaction === "like" ? 1 : -1);
export function reactionFromValue(value: number | null): ReactionType | null {
  if (value === 1) return "like";
  if (value === -1) return "dislike";
  return null;
}

export type ListingStats = {
  likes: number;
  dislikes: number;
  views: number;
  comments: number;
  myReaction: ReactionType | null;
};

export const emptyStats: ListingStats = { likes: 0, dislikes: 0, views: 0, comments: 0, myReaction: null };

// El puntaje del ranking: me gusta menos no me gusta.
export const scoreOf = (stats: ListingStats) => stats.likes - stats.dislikes;
