import { AuthInMemoryDataSource } from "@/src/features/auth/data/datasources/AuthInMemoryDataSource";
import { AuthRepositoryImpl } from "@/src/features/auth/data/repositories/AuthRepositoryImpl";
import { GroupChatInMemoryDataSource } from "@/src/features/groups/data/datasources/GroupChatInMemoryDataSource";
import { GroupInMemoryDataSource } from "@/src/features/groups/data/datasources/GroupInMemoryDataSource";
import { GroupChatRepositoryImpl } from "@/src/features/groups/data/repositories/GroupChatRepositoryImpl";
import { GroupRepositoryImpl } from "@/src/features/groups/data/repositories/GroupRepositoryImpl";
import { EngagementInMemoryDataSource } from "@/src/features/listings/data/datasources/EngagementInMemoryDataSource";
import { FileStorageInMemoryDataSource } from "@/src/features/listings/data/datasources/FileStorageInMemoryDataSource";
import { ListingInMemoryDataSource } from "@/src/features/listings/data/datasources/ListingInMemoryDataSource";
import { MentorshipInMemoryDataSource } from "@/src/features/listings/data/datasources/MentorshipInMemoryDataSource";
import { ProjectFileInMemoryDataSource } from "@/src/features/listings/data/datasources/ProjectFileInMemoryDataSource";
import { TaskInMemoryDataSource } from "@/src/features/listings/data/datasources/TaskInMemoryDataSource";
import { EngagementRepositoryImpl } from "@/src/features/listings/data/repositories/EngagementRepositoryImpl";
import { ListingRepositoryImpl } from "@/src/features/listings/data/repositories/ListingRepositoryImpl";
import { MentorshipRepositoryImpl } from "@/src/features/listings/data/repositories/MentorshipRepositoryImpl";
import { ProjectFileRepositoryImpl } from "@/src/features/listings/data/repositories/ProjectFileRepositoryImpl";
import { TaskRepositoryImpl } from "@/src/features/listings/data/repositories/TaskRepositoryImpl";
import { NotificationInMemoryDataSource } from "@/src/features/notifications/data/datasources/NotificationInMemoryDataSource";
import { NotificationRepositoryImpl } from "@/src/features/notifications/data/repositories/NotificationRepositoryImpl";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { UserInMemoryDataSource } from "@/src/features/users/data/datasources/UserInMemoryDataSource";
import { UserRepositoryImpl } from "@/src/features/users/data/repositories/UserRepositoryImpl";
import { SystemFilePicker } from "../platform/FilePicker";
import { SystemLinkOpener } from "../platform/LinkOpener";
import { DummyData } from "../data/dummyData";
import { Container } from "./container";
import { TOKENS } from "./tokens";

// Los mismos repositorios, con los datasources en memoria (`LocalTables`). Es
// lo que usan las pruebas de integración y sirve para trabajar en la UI sin
// servidor (`EXPO_PUBLIC_DATA_SOURCE=local`). Que solo cambie el datasource es
// la prueba de que la separación vale.
export function createLocalContainer(data: DummyData = new DummyData()): Container {
  const listings = new ListingRepositoryImpl(new ListingInMemoryDataSource(data));
  const groups = new GroupRepositoryImpl(new GroupInMemoryDataSource(data));
  const notifications = new NotificationRepositoryImpl(new NotificationInMemoryDataSource(data));

  return new Container()
    .register(TOKENS.AuthRepo, new AuthRepositoryImpl(new AuthInMemoryDataSource(data)))
    .register(TOKENS.UserRepo, new UserRepositoryImpl(new UserInMemoryDataSource(data)))
    .register(TOKENS.ListingRepo, listings)
    .register(TOKENS.EngagementRepo, new EngagementRepositoryImpl(new EngagementInMemoryDataSource(data)))
    .register(TOKENS.TaskRepo, new TaskRepositoryImpl(new TaskInMemoryDataSource(data)))
    .register(
      TOKENS.ProjectFileRepo,
      new ProjectFileRepositoryImpl(new ProjectFileInMemoryDataSource(data), new FileStorageInMemoryDataSource(data), listings),
    )
    .register(TOKENS.MentorshipRepo, new MentorshipRepositoryImpl(new MentorshipInMemoryDataSource(data), listings))
    .register(TOKENS.GroupRepo, groups)
    .register(TOKENS.GroupChatRepo, new GroupChatRepositoryImpl(new GroupChatInMemoryDataSource(data), groups))
    .register(TOKENS.NotificationRepo, notifications)
    .register(TOKENS.NotificationPublisher, new NotificationPublisher(notifications))
    .register(TOKENS.FilePicker, new SystemFilePicker())
    .register(TOKENS.LinkOpener, new SystemLinkOpener());
}
