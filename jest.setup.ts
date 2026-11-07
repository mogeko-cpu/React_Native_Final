import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import "react-native-gesture-handler/jestSetup";

import { usePoller } from "./src/core/hooks/usePoller";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("react-native-gesture-handler", () => jest.requireActual("react-native-gesture-handler"));

// El selector de fechas trae dependencias en ESM que Jest no transforma; en las
// pruebas basta con que exista.
jest.mock("react-native-paper-dates", () => ({
  registerTranslation: () => undefined,
  es: {},
  DatePickerModal: () => null,
}));

// Sin temporizadores vivos entre pruebas.
usePoller.disabled = true;
