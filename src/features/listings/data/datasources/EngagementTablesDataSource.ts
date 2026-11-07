import { TableOps } from "@/src/core/data/tableOps";
import { Row } from "@/src/core/roble/guard";
import { EngagementDataSource } from "./EngagementDataSource";

export abstract class EngagementTablesDataSource implements EngagementDataSource {
  protected abstract reactions: TableOps;
  protected abstract views: TableOps;
  protected abstract comments: TableOps;

  readReactions(filters?: Record<string, string>) {
    return this.reactions.read(filters);
  }
  insertReaction(row: Row) {
    return this.reactions.insert(row);
  }
  updateReaction(id: string, changes: Row) {
    return this.reactions.update(id, changes);
  }
  deleteReaction(id: string) {
    return this.reactions.remove(id);
  }
  readViews(filters?: Record<string, string>) {
    return this.views.read(filters);
  }
  insertView(row: Row) {
    return this.views.insert(row);
  }
  deleteView(id: string) {
    return this.views.remove(id);
  }
  readComments(filters?: Record<string, string>) {
    return this.comments.read(filters);
  }
  insertComment(row: Row) {
    return this.comments.insert(row);
  }
  deleteComment(id: string) {
    return this.comments.remove(id);
  }
}
