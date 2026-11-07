import { GroupMessage } from "../entities/Group";

// El chat de un grupo. Solo lo usan las personas del grupo.
export interface GroupChatRepository {
  getMessages(p: { groupId: string; userId: string }): Promise<GroupMessage[]>;
  send(message: { groupId: string; senderId: string; senderName: string; body: string }): Promise<GroupMessage>;
}

export const MAX_MESSAGE_LENGTH = 1000;
