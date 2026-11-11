import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { View } from "react-native";

import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import LoginScreen from "@/src/features/auth/presentation/screens/LoginScreen";
import ForgotPasswordScreen from "@/src/features/auth/presentation/screens/ForgotPasswordScreen";
import RegisterScreen from "@/src/features/auth/presentation/screens/RegisterScreen";
import ResetPasswordScreen from "@/src/features/auth/presentation/screens/ResetPasswordScreen";
import VerifyEmailScreen from "@/src/features/auth/presentation/screens/VerifyEmailScreen";
import CreateGroupScreen from "@/src/features/groups/presentation/screens/CreateGroupScreen";
import GroupChatScreen from "@/src/features/groups/presentation/screens/GroupChatScreen";
import GroupDetailScreen from "@/src/features/groups/presentation/screens/GroupDetailScreen";
import GroupsScreen from "@/src/features/groups/presentation/screens/GroupsScreen";
import InviteMembersScreen from "@/src/features/groups/presentation/screens/InviteMembersScreen";
import HomeScreen from "@/src/features/home/presentation/screens/HomeScreen";
import CreateListingScreen from "@/src/features/listings/presentation/screens/CreateListingScreen";
import EditListingScreen from "@/src/features/listings/presentation/screens/EditListingScreen";
import FilesScreen from "@/src/features/listings/presentation/screens/FilesScreen";
import JoinRequestScreen from "@/src/features/listings/presentation/screens/JoinRequestScreen";
import ListingDetailScreen from "@/src/features/listings/presentation/screens/ListingDetailScreen";
import ListingsScreen from "@/src/features/listings/presentation/screens/ListingsScreen";
import RankingScreen from "@/src/features/listings/presentation/screens/RankingScreen";
import TasksScreen from "@/src/features/listings/presentation/screens/TasksScreen";
import { NotificationBell } from "@/src/features/notifications/presentation/components/NotificationBell";
import NotificationsScreen from "@/src/features/notifications/presentation/screens/NotificationsScreen";
import ProfileScreen, { ProfileHeaderActions } from "@/src/features/profile/presentation/screens/ProfileScreen";
import { useAppTheme } from "@/src/theme/theme";
import { AppTabBar } from "./AppTabBar";
import { headerOptions } from "./headerOptions";
import { RootStackParamList, TabParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Las cinco pestañas. Inicio no tiene barra arriba: el saludo hace de barra.
function Tabs() {
  const theme = useAppTheme();
  const bell = () => <NotificationBell color={theme.colors.onAppBar} />;
  return (
    <Tab.Navigator tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ ...headerOptions(theme), sceneStyle: { backgroundColor: theme.colors.background } }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false, title: "Inicio" }} />
      <Tab.Screen name="Explore" component={ListingsScreen} options={{ title: "Explorar proyectos", headerRight: bell }} />
      <Tab.Screen name="Ranking" component={RankingScreen} options={{ title: "Ranking", headerRight: bell }} />
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ title: "Grupos", headerRight: bell }} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {bell()}
              <ProfileHeaderActions />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Sin sesión solo existen el login y el registro (`app_bindings.dart` elegía
// `home` o `login` como primera ruta). Con sesión, las pestañas y lo demás.
export default function RootNavigator() {
  const theme = useAppTheme();
  const { user } = useSession();
  return (
    <Stack.Navigator screenOptions={headerOptions(theme)}>
      {user == null ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Crear cuenta" }} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: "Verificar correo" }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Recuperar contraseña" }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: "Contraseña nueva" }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "Proyecto" }} />
          <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ title: "Publicar idea" }} />
          <Stack.Screen name="EditListing" component={EditListingScreen} options={{ title: "Editar proyecto" }} />
          <Stack.Screen name="JoinRequest" component={JoinRequestScreen} options={{ title: "Solicitar unirme" }} />
          <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: "Tareas" }} />
          <Stack.Screen name="Files" component={FilesScreen} options={{ title: "Archivos" }} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: "Crear grupo" }} />
          <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: "Grupo" }} />
          <Stack.Screen name="InviteMembers" component={InviteMembersScreen} options={{ title: "Invitar al grupo" }} />
          <Stack.Screen name="GroupChat" component={GroupChatScreen} options={{ title: "Chat del grupo" }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notificaciones" }} />
        </>
      )}
    </Stack.Navigator>
  );
}
