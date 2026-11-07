// Los nombres de las tablas en un solo sitio: un error de tipeo aquí es un
// 404, no un error de compilación. Son las mismas 16 tablas de la versión
// Flutter (`docs/roble.md`), así que las dos apps comparten los datos.
export const Tables = {
  listings: "listings",
  listingMembers: "listing_members",
  joinRequests: "join_requests",
  listingTasks: "listing_tasks",
  projectFiles: "project_files",
  mentorshipRequests: "mentorship_requests",
  groups: "groups",
  groupMembers: "group_members",
  groupRequests: "group_requests",
  listingReactions: "listing_reactions",
  listingViews: "listing_views",
  listingComments: "listing_comments",
  appUsers: "app_users",
  groupInvitations: "group_invitations",
  groupMessages: "group_messages",
  notifications: "notifications",
} as const;

export type TableName = (typeof Tables)[keyof typeof Tables];
