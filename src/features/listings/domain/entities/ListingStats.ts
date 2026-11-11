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

// Lo que queda después de tocar una reacción, sin esperar a Roble: tocar la que
// ya tenías la quita, tocar la otra la reemplaza. La pantalla lo muestra al
// instante y, si Roble falla, vuelve a lo de antes.
export function applyReaction(stats: ListingStats, reaction: ReactionType): ListingStats {
  const next = { ...stats };
  if (stats.myReaction === "like") next.likes = Math.max(0, next.likes - 1);
  if (stats.myReaction === "dislike") next.dislikes = Math.max(0, next.dislikes - 1);
  if (stats.myReaction === reaction) return { ...next, myReaction: null };
  if (reaction === "like") next.likes += 1;
  else next.dislikes += 1;
  return { ...next, myReaction: reaction };
}
