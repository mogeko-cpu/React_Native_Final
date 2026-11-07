// Una solicitud de mentoría (`mentorship_request.dart`). Una por proyecto: la
// fila existe solo mientras espera.
export type MentorshipRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  requesterId: string;
  requesterName: string;
  mentorId: string;
  mentorName: string;
  message: string;
  createdAt: Date;
};
