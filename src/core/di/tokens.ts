// Las llaves del contenedor: una por interfaz.
export const TOKENS = {
  RobleClient: Symbol("RobleClient"),
  AuthRepo: Symbol("AuthRepository"),
  UserRepo: Symbol("UserRepository"),
  ListingRepo: Symbol("ListingRepository"),
  EngagementRepo: Symbol("EngagementRepository"),
  TaskRepo: Symbol("TaskRepository"),
  ProjectFileRepo: Symbol("ProjectFileRepository"),
  MentorshipRepo: Symbol("MentorshipRepository"),
  SavedListingRepo: Symbol("SavedListingRepository"),
  GroupRepo: Symbol("GroupRepository"),
  GroupChatRepo: Symbol("GroupChatRepository"),
  NotificationRepo: Symbol("NotificationRepository"),
  NotificationPublisher: Symbol("NotificationPublisher"),
  FilePicker: Symbol("FilePicker"),
  LinkOpener: Symbol("LinkOpener"),
  Sharer: Symbol("Sharer"),
} as const;
