import { Row } from "@/src/core/roble/guard";

// Los mensajes de los chats de grupo (`group_messages`).
export interface GroupChatDataSource {
  readMessages(filters: Record<string, string>): Promise<Row[]>;
  insertMessage(row: Row): Promise<Row>;
}
