import { Row } from "@/src/core/roble/guard";

// Valoraciones, vistas y comentarios en filas.
export interface EngagementDataSource {
  readReactions(filters?: Record<string, string>): Promise<Row[]>;
  insertReaction(row: Row): Promise<Row>;
  updateReaction(id: string, changes: Row): Promise<void>;
  deleteReaction(id: string): Promise<void>;
  readViews(filters?: Record<string, string>): Promise<Row[]>;
  insertView(row: Row): Promise<Row>;
  deleteView(id: string): Promise<void>;
  readComments(filters?: Record<string, string>): Promise<Row[]>;
  insertComment(row: Row): Promise<Row>;
  deleteComment(id: string): Promise<void>;
}
