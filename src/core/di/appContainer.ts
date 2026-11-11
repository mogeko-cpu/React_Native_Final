import { AuthRemoteDataSource } from "@/src/features/auth/data/datasources/AuthRemoteDataSource";
import { AuthRepositoryImpl } from "@/src/features/auth/data/repositories/AuthRepositoryImpl";
import { GroupChatRemoteDataSource } from "@/src/features/groups/data/datasources/GroupChatRemoteDataSource";
import { GroupRemoteDataSource } from "@/src/features/groups/data/datasources/GroupRemoteDataSource";
import { GroupChatRepositoryImpl } from "@/src/features/groups/data/repositories/GroupChatRepositoryImpl";
import { GroupRepositoryImpl } from "@/src/features/groups/data/repositories/GroupRepositoryImpl";
import { EngagementRemoteDataSource } from "@/src/features/listings/data/datasources/EngagementRemoteDataSource";
import { FileStorageRemoteDataSource } from "@/src/features/listings/data/datasources/FileStorageRemoteDataSource";
import { ListingRemoteDataSource } from "@/src/features/listings/data/datasources/ListingRemoteDataSource";
import { MentorshipRemoteDataSource } from "@/src/features/listings/data/datasources/MentorshipRemoteDataSource";
import { ProjectFileRemoteDataSource } from "@/src/features/listings/data/datasources/ProjectFileRemoteDataSource";
import { TaskRemoteDataSource } from "@/src/features/listings/data/datasources/TaskRemoteDataSource";
import { EngagementRepositoryImpl } from "@/src/features/listings/data/repositories/EngagementRepositoryImpl";
import { ListingRepositoryImpl } from "@/src/features/listings/data/repositories/ListingRepositoryImpl";
import { MentorshipRepositoryImpl } from "@/src/features/listings/data/repositories/MentorshipRepositoryImpl";
import { ProjectFileRepositoryImpl } from "@/src/features/listings/data/repositories/ProjectFileRepositoryImpl";
import { SavedListingRemoteDataSource } from "@/src/features/listings/data/datasources/SavedListingRemoteDataSource";
import { SavedListingRepositoryImpl } from "@/src/features/listings/data/repositories/SavedListingRepositoryImpl";
import { TaskRepositoryImpl } from "@/src/features/listings/data/repositories/TaskRepositoryImpl";
import { NotificationRemoteDataSource } from "@/src/features/notifications/data/datasources/NotificationRemoteDataSource";
import { NotificationRepositoryImpl } from "@/src/features/notifications/data/repositories/NotificationRepositoryImpl";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { UserRemoteDataSource } from "@/src/features/users/data/datasources/UserRemoteDataSource";
import { UserRepositoryImpl } from "@/src/features/users/data/repositories/UserRepositoryImpl";
import { SystemFilePicker } from "../platform/FilePicker";
import { SystemLinkOpener } from "../platform/LinkOpener";
import { SystemSharer } from "../platform/Sharer";
import { robleConfig } from "../roble/robleConfig";
import { RobleClient } from "../roble/RobleClient";
import { Container } from "./container";
import { TOKENS } from "./tokens";

// La raíz de composición (`app_bindings.dart`): el único lugar que sabe qué
// implementación respalda cada interfaz. Lo que se elige aquí es el
// datasource; hay un repositorio por cada interfaz del dominio.
export function createAppContainer(): Container {
  // Un solo cliente de Roble para toda la app: uno por pantalla le daría a cada
  // copia su propia sesión.
  const client = new RobleClient(robleConfig);

  const listings = new ListingRepositoryImpl(new ListingRemoteDataSource(client));
  const groups = new GroupRepositoryImpl(new GroupRemoteDataSource(client));
  const notifications = new NotificationRepositoryImpl(new NotificationRemoteDataSource(client));

  return new Container()
    .register(TOKENS.RobleClient, client)
    .register(TOKENS.AuthRepo, new AuthRepositoryImpl(new AuthRemoteDataSource(client)))
    .register(TOKENS.UserRepo, new UserRepositoryImpl(new UserRemoteDataSource(client)))
    .register(TOKENS.ListingRepo, listings)
    .register(TOKENS.EngagementRepo, new EngagementRepositoryImpl(new EngagementRemoteDataSource(client)))
    .register(TOKENS.TaskRepo, new TaskRepositoryImpl(new TaskRemoteDataSource(client)))
    .register(
      TOKENS.ProjectFileRepo,
      new ProjectFileRepositoryImpl(new ProjectFileRemoteDataSource(client), new FileStorageRemoteDataSource(client), listings),
    )
    .register(TOKENS.MentorshipRepo, new MentorshipRepositoryImpl(new MentorshipRemoteDataSource(client), listings))
    .register(TOKENS.SavedListingRepo, new SavedListingRepositoryImpl(new SavedListingRemoteDataSource(client), listings))
    .register(TOKENS.GroupRepo, groups)
    .register(TOKENS.GroupChatRepo, new GroupChatRepositoryImpl(new GroupChatRemoteDataSource(client), groups))
    .register(TOKENS.NotificationRepo, notifications)
    .register(TOKENS.NotificationPublisher, new NotificationPublisher(notifications))
    .register(TOKENS.FilePicker, new SystemFilePicker())
    .register(TOKENS.LinkOpener, new SystemLinkOpener())
    .register(TOKENS.Sharer, new SystemSharer());
}
