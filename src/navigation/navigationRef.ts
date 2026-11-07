import { createNavigationContainerRef } from "@react-navigation/native";

import { RootStackParamList } from "./types";

// Para navegar desde fuera de una pantalla.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
