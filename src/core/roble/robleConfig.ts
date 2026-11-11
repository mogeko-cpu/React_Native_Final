// A qué proyecto de Roble apunta la app.
//
// Campus Innovate en Flutter compila el host y el contrato como valores por
// defecto (`roble_config.dart`): el `contractId` no es un secreto, viaja en la
// ruta de cada petición. Aquí se hace igual, y el `.env` solo hace falta para
// apuntar a otro proyecto. Expo inyecta las variables `EXPO_PUBLIC_*` al
// compilar, así que hay que leerlas con el nombre completo escrito.
export const defaultRobleBaseUrl = "https://roble-api.openlab.uninorte.edu.co";
export const defaultRobleContractId = "campus_innov_0ee3af93b1";

export const robleConfig = {
  baseUrl: process.env.EXPO_PUBLIC_ROBLE_BASE_URL || defaultRobleBaseUrl,
  contractId: process.env.EXPO_PUBLIC_ROBLE_CONTRACT_ID || defaultRobleContractId,
  // El *nombre* del destino de regreso del inicio con Google, registrado en la
  // consola de Roble. Nunca una URL: así ninguna compilación puede mandar a
  // nadie a un destino que el dueño del proyecto no aprobó.
  socialRedirect: process.env.EXPO_PUBLIC_ROBLE_SOCIAL_REDIRECT || "default",
  // El destino del teléfono (`campusinnovate://auth`). Hay que registrarlo en
  // la consola con este nombre para que «Continuar con Google» sirva fuera
  // de la web.
  socialRedirectMobile: process.env.EXPO_PUBLIC_ROBLE_SOCIAL_REDIRECT_MOBILE || "mobile",
};

// `EXPO_PUBLIC_DATA_SOURCE=local` arranca con los datos en memoria
// (`localContainer.ts`): la app entera sin servidor, para trabajar en la UI.
export const useLocalData = process.env.EXPO_PUBLIC_DATA_SOURCE === "local";

// Las variables que quedaron vacías. Con los valores por defecto nunca pasa,
// salvo que alguien los borre a propósito en el `.env`.
export function missingRobleConfig(): string[] {
  return [
    ...(robleConfig.baseUrl ? [] : ["EXPO_PUBLIC_ROBLE_BASE_URL"]),
    ...(robleConfig.contractId ? [] : ["EXPO_PUBLIC_ROBLE_CONTRACT_ID"]),
  ];
}
