import { NavigatorScreenParams } from "@react-navigation/native";

// Las pestañas de abajo (`app_bottom_nav.dart`): Inicio, Explorar, Ranking,
// Grupos y Perfil.
export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Ranking: undefined;
  Groups: undefined;
  Profile: undefined;
};

// Las rutas de `app_routes.dart`. Los ids son los `_id` UUID de las filas.
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  ListingDetail: { listingId: string };
  CreateListing: undefined;
  EditListing: { listingId: string };
  JoinRequest: { listingId: string };
  Tasks: { listingId: string };
  Files: { listingId: string };
  CreateGroup: undefined;
  GroupDetail: { groupId: string };
  InviteMembers: { groupId: string };
  GroupChat: { groupId: string };
  Notifications: undefined;
};

// Hace que `useNavigation()` y `navigate()` revisen los tipos en toda la app.
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
