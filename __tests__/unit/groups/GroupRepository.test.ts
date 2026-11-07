import { DummyData } from "@/src/core/data/dummyData";
import { GroupChatInMemoryDataSource } from "@/src/features/groups/data/datasources/GroupChatInMemoryDataSource";
import { GroupInMemoryDataSource } from "@/src/features/groups/data/datasources/GroupInMemoryDataSource";
import { GroupChatRepositoryImpl } from "@/src/features/groups/data/repositories/GroupChatRepositoryImpl";
import { GroupRepositoryImpl } from "@/src/features/groups/data/repositories/GroupRepositoryImpl";
import { hasMember } from "@/src/features/groups/domain/entities/Group";

function setup() {
  const data = new DummyData(false);
  const groups = new GroupRepositoryImpl(new GroupInMemoryDataSource(data));
  const chat = new GroupChatRepositoryImpl(new GroupChatInMemoryDataSource(data), groups);
  return { groups, chat };
}

describe("GroupRepositoryImpl", () => {
  it("solicitar, aceptar y chatear", async () => {
    const { groups, chat } = setup();
    const group = await groups.createGroup({ name: "Semillero", description: "Robótica para el campus", ownerId: "ana", ownerName: "Ana" });
    await expect(chat.send({ groupId: group.id, senderId: "beto", senderName: "Beto", body: "hola" })).rejects.toThrow("Solo las personas del grupo pueden usar su chat.");
    const request = await groups.requestToJoin({ groupId: group.id, applicantId: "beto", applicantName: "Beto", message: "Quiero entrar" });
    await expect(groups.requestToJoin({ groupId: group.id, applicantId: "beto", applicantName: "Beto", message: "otra" })).rejects.toThrow("Ya enviaste una solicitud a este grupo.");
    await groups.acceptRequest(request.id);
    expect(hasMember((await groups.getGroupById(group.id))!, "beto")).toBe(true);
    // La solicitud respondida se borra.
    expect(await groups.getRequestsForGroup(group.id)).toEqual([]);
    await chat.send({ groupId: group.id, senderId: "beto", senderName: "Beto", body: "  hola  " });
    const messages = await chat.getMessages({ groupId: group.id, userId: "ana" });
    expect(messages.map((m) => m.body)).toEqual(["hola"]);
  });

  it("invitar: el creador no puede salir y una invitación aceptada lo hace integrante", async () => {
    const { groups } = setup();
    const group = await groups.createGroup({ name: "Club", description: "Emprendimiento estudiantil", ownerId: "ana", ownerName: "Ana" });
    const invitation = await groups.inviteUser({ groupId: group.id, groupName: group.name, inviterId: "ana", inviterName: "Ana", inviteeId: "caro", inviteeName: "Caro" });
    await expect(groups.inviteUser({ ...invitation })).rejects.toThrow("Esta persona ya tiene una invitación pendiente a este grupo.");
    await groups.acceptInvitation(invitation.id);
    expect((await groups.getMyGroups("caro")).map((g) => g.id)).toEqual([group.id]);
    await expect(groups.removeMember({ groupId: group.id, userId: "ana" })).rejects.toThrow(/El creador no puede salir/);
  });
});
