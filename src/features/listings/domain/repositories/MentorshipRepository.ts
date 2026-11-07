import { MentorshipRequest } from "../entities/MentorshipRequest";

export interface MentorshipRepository {
  getPendingFor(listingId: string): Promise<MentorshipRequest | null>;
  // Lo que le pidieron a `mentorId`.
  getMyInvitations(mentorId: string): Promise<MentorshipRequest[]>;
  request(draft: Omit<MentorshipRequest, "id" | "createdAt">): Promise<MentorshipRequest>;
  accept(p: { requestId: string; actorId: string }): Promise<MentorshipRequest>;
  reject(p: { requestId: string; actorId: string }): Promise<MentorshipRequest>;
  cancel(p: { requestId: string; actorId: string }): Promise<void>;
  purgeListing(listingId: string): Promise<void>;
}

export const MAX_MENTORSHIP_MESSAGE = 500;
