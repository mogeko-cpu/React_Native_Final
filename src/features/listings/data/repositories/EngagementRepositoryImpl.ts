import { byDateDesc, guardRoble, intOf, isDuplicateRow, isRowId, nowIso, Row, str, translateRobleError } from "@/src/core/roble/guard";
import { ListingComment } from "../../domain/entities/ListingComment";
import { emptyStats, ListingStats, reactionFromValue, ReactionType, reactionValue } from "../../domain/entities/ListingStats";
import { ListingFailure } from "../../domain/ListingFailure";
import { EngagementRepository } from "../../domain/repositories/EngagementRepository";
import { EngagementDataSource } from "../datasources/EngagementDataSource";

const failure = (message: string) => new ListingFailure(message);

// Valoraciones, vistas y comentarios (`roble_engagement_source.dart` +
// `engagement_repository.dart`). Todo se cuenta de las filas cada vez.
export class EngagementRepositoryImpl implements EngagementRepository {
  constructor(private readonly source: EngagementDataSource) {}

  private q<T>(action: () => Promise<T>): Promise<T> {
    return guardRoble(action, failure);
  }

  async getStats(userId: string): Promise<Record<string, ListingStats>> {
    const reactions = await this.q(() => this.source.readReactions());
    const views = await this.q(() => this.source.readViews());
    const comments = await this.q(() => this.source.readComments());
    const stats: Record<string, ListingStats> = {};
    const of = (id: string) => (stats[id] ??= { ...emptyStats });
    for (const row of reactions) {
      const id = str(row.listing_id);
      const reaction = reactionFromValue(intOf(row.value, 0));
      if (!id || !reaction) continue;
      const entry = of(id);
      if (reaction === "like") entry.likes++;
      else entry.dislikes++;
      if (str(row.user_id) === userId) entry.myReaction = reaction;
    }
    for (const row of views) if (row.listing_id) of(str(row.listing_id)).views++;
    for (const row of comments) if (row.listing_id) of(str(row.listing_id)).comments++;
    return stats;
  }

  async getStatsFor(listingId: string, userId: string): Promise<ListingStats> {
    if (!isRowId(listingId)) return { ...emptyStats };
    const filter = { listing_id: listingId };
    const reactions = await this.q(() => this.source.readReactions(filter));
    const views = await this.q(() => this.source.readViews(filter));
    const comments = await this.q(() => this.source.readComments(filter));
    const stats: ListingStats = { ...emptyStats, views: views.length, comments: comments.length };
    for (const row of reactions) {
      const reaction = reactionFromValue(intOf(row.value, 0));
      if (!reaction) continue;
      if (reaction === "like") stats.likes++;
      else stats.dislikes++;
      if (str(row.user_id) === userId) stats.myReaction = reaction;
    }
    return stats;
  }

  // Cambiar de opinión es un `UPDATE` de la fila que ya es tuya, y quitar el
  // voto es borrarla. El `UNIQUE (listing_id, user_id)` impide votar dos veces.
  async toggleReaction(p: { listingId: string; groupId: string; userId: string; reaction: ReactionType; current: ReactionType | null }) {
    if (!isRowId(p.listingId)) throw failure("Este proyecto ya no existe.");
    const next = p.current === p.reaction ? null : p.reaction;
    const rows = await this.q(() => this.source.readReactions({ listing_id: p.listingId, user_id: p.userId }));
    const existingId = rows.length > 0 ? str(rows[0]._id) : null;
    if (next == null) {
      if (existingId) await this.q(() => this.source.deleteReaction(existingId));
      return;
    }
    if (existingId) {
      await this.q(() => this.source.updateReaction(existingId, { value: reactionValue(next) }));
      return;
    }
    try {
      await this.source.insertReaction({ listing_id: p.listingId, group_id: p.groupId, user_id: p.userId, value: reactionValue(next), created_at: nowIso() });
    } catch (e) {
      if (isDuplicateRow(e)) return;
      throw translateRobleError(e, failure);
    }
  }

  // Volver a abrir un proyecto no suma: la fila ya existe y el `UNIQUE` la rechaza.
  async registerView(p: { listingId: string; groupId: string; userId: string }) {
    if (!isRowId(p.listingId)) return;
    try {
      await this.source.insertView({ listing_id: p.listingId, group_id: p.groupId, user_id: p.userId, viewed_at: nowIso() });
    } catch (e) {
      if (isDuplicateRow(e)) return;
      throw translateRobleError(e, failure);
    }
  }

  async getComments(listingId: string): Promise<ListingComment[]> {
    if (!isRowId(listingId)) return [];
    const rows = await this.q(() => this.source.readComments({ listing_id: listingId }));
    return rows.sort(byDateDesc("created_at")).map(toComment).filter((c): c is ListingComment => c != null);
  }

  async addComment(draft: Omit<ListingComment, "id" | "createdAt">): Promise<ListingComment> {
    if (!draft.body.trim()) throw failure("Escribe algo antes de comentar.");
    const createdAt = new Date();
    const row = await this.q(() =>
      this.source.insertComment({
        listing_id: draft.listingId,
        group_id: draft.groupId,
        author_id: draft.authorId,
        author_name: draft.authorName,
        body: draft.body,
        created_at: createdAt.toISOString(),
      }),
    );
    return { ...draft, id: str(row._id), createdAt };
  }

  deleteComment(commentId: string) {
    return this.q(() => this.source.deleteComment(commentId));
  }

  async purgeListing(listingId: string) {
    const filter = { listing_id: listingId };
    for (const row of await this.q(() => this.source.readReactions(filter))) await this.q(() => this.source.deleteReaction(str(row._id)));
    for (const row of await this.q(() => this.source.readViews(filter))) await this.q(() => this.source.deleteView(str(row._id)));
    for (const row of await this.q(() => this.source.readComments(filter))) await this.q(() => this.source.deleteComment(str(row._id)));
  }
}

function toComment(row: Row): ListingComment | null {
  const id = str(row._id);
  const listingId = str(row.listing_id);
  if (!id || !listingId) return null;
  return {
    id,
    listingId,
    groupId: str(row.group_id),
    authorId: str(row.author_id),
    authorName: str(row.author_name, "Estudiante"),
    body: str(row.body),
    createdAt: new Date(str(row.created_at) || 0),
  };
}
