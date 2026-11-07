import { Group, GroupInvitation, GroupRequest } from "../entities/Group";

// Los grupos (`i_group_repository.dart`).
export interface GroupRepository {
  getGroups(): Promise<Group[]>;
  // Los de la persona, primero los que creó.
  getMyGroups(userId: string): Promise<Group[]>;
  getGroupById(id: string): Promise<Group | null>;
  createGroup(draft: { name: string; description: string; ownerId: string; ownerName: string }): Promise<Group>;
  deleteGroup(groupId: string): Promise<void>;
  requestToJoin(request: { groupId: string; applicantId: string; applicantName: string; message: string }): Promise<GroupRequest>;
  getRequestsForGroup(groupId: string): Promise<GroupRequest[]>;
  getMyRequestForGroup(groupId: string, applicantId: string): Promise<GroupRequest | null>;
  getMyRequests(applicantId: string): Promise<GroupRequest[]>;
  acceptRequest(requestId: string): Promise<GroupRequest>;
  rejectRequest(requestId: string): Promise<GroupRequest>;
  inviteUser(invitation: Omit<GroupInvitation, "id">): Promise<GroupInvitation>;
  getInvitationsForGroup(groupId: string): Promise<GroupInvitation[]>;
  getMyInvitations(inviteeId: string): Promise<GroupInvitation[]>;
  acceptInvitation(invitationId: string): Promise<GroupInvitation>;
  rejectInvitation(invitationId: string): Promise<GroupInvitation>;
  cancelInvitation(invitationId: string): Promise<void>;
  removeMember(p: { groupId: string; userId: string }): Promise<void>;
}
