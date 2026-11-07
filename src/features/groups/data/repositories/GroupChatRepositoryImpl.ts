import { byDateAsc, guardRoble, isRowId, parseDate, Row, str } from "@/src/core/roble/guard";
import { Group, GroupMessage, hasMember } from "../../domain/entities/Group";
import { GroupFailure } from "../../domain/GroupFailure";
import { GroupChatRepository, MAX_MESSAGE_LENGTH } from "../../domain/repositories/GroupChatRepository";
import { GroupRepository } from "../../domain/repositories/GroupRepository";
import { GroupChatDataSource } from "../datasources/GroupChatDataSource";

const failure = (message: string) => new GroupFailure(message);

// `read` no deja pedir «los mensajes después de este»: cada lectura trae la
// conversación completa, con un tope de 200.
const MAX_MESSAGES = 200;

export class GroupChatRepositoryImpl implements GroupChatRepository {
  constructor(
    private readonly source: GroupChatDataSource,
    private readonly groups: GroupRepository,
  ) {}

  private q<T>(action: () => Promise<T>): Promise<T> {
    return guardRoble(action, failure);
  }

  async getMessages({ groupId, userId }: { groupId: string; userId: string }): Promise<GroupMessage[]> {
    await this.requireMember(groupId, userId);
    if (!isRowId(groupId)) return [];
    const rows = (await this.q(() => this.source.readMessages({ group_id: groupId }))).sort(byDateAsc("created_at"));
    return rows.slice(-MAX_MESSAGES).map(toMessage).filter((m): m is GroupMessage => m != null);
  }

  async send(message: { groupId: string; senderId: string; senderName: string; body: string }): Promise<GroupMessage> {
    const body = message.body.trim();
    if (!body) throw failure("Escribe algo antes de enviar.");
    if (body.length > MAX_MESSAGE_LENGTH) throw failure(`El mensaje es muy largo. Máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
    await this.requireMember(message.groupId, message.senderId);
    const createdAt = new Date();
    const row = await this.q(() =>
      this.source.insertMessage({
        group_id: message.groupId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        body,
        created_at: createdAt.toISOString(),
      }),
    );
    const id = str(row._id);
    if (!id) throw failure("ROBLE guardó el mensaje pero no devolvió su identificador. Actualiza el chat antes de volver a enviarlo.");
    return { id, groupId: message.groupId, senderId: message.senderId, senderName: message.senderName, body, createdAt };
  }

  private async requireMember(groupId: string, userId: string): Promise<Group> {
    const group = await this.groups.getGroupById(groupId);
    if (!group) throw failure("Este grupo ya no existe.");
    if (!hasMember(group, userId)) throw failure("Solo las personas del grupo pueden usar su chat.");
    return group;
  }
}

function toMessage(row: Row): GroupMessage | null {
  const id = str(row._id);
  const groupId = str(row.group_id);
  if (!id || !groupId) return null;
  return {
    id,
    groupId,
    senderId: str(row.sender_id),
    senderName: str(row.sender_name, "Estudiante"),
    body: str(row.body),
    createdAt: parseDate(row.created_at),
  };
}
