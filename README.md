## Video

Link: https://youtu.be/kB93CcpH0KY

## Integrantes:

GONZALEZ QUINTANILLA SEBASTIAN.

TRIANA MARTINEZ LEONEL.

PATERNINA ARZUZA ESTEFANIA.

## Qué hace

Igual que la versión Flutter, pantalla por pantalla:

- **Cuenta**: iniciar sesión, crear cuenta (con la política de contraseñas de
  Roble revisada antes de gastar un registro) y «Continuar con Google» (solo en
  la versión web, como en Flutter). La sesión se guarda y se restaura al abrir.
- **Inicio**: saludo, «Publicar idea», ideas destacadas (proyectos que buscan
  gente), solicitudes de mentoría que te llegaron y tus proyectos.
- **Explorar**: búsqueda por título o descripción y filtros por categoría y por
  estado (Idea, En curso, Pausado, Terminado).
- **Ranking**: proyectos ordenados por me gusta − no me gusta; desempatan los
  comentarios y las vistas.
- **Detalle del proyecto**: solicitar unirse, valorar (me gusta / no me gusta),
  comentar, ver el equipo con roles (líder, integrante, mentor) y, si eres líder,
  editar, eliminar, responder solicitudes, cambiar roles, quitar personas y
  transferir el liderazgo.
- **Espacio del equipo**: tablero de tareas por columnas (Por hacer, En
  progreso, Hecho, Cancelado) con responsable, fecha límite y avance; carpeta de
  archivos y enlaces (hasta 10 MB por archivo); y mentoría (pedirla a alguien
  del directorio, aceptarla o rechazarla).
- **Grupos**: crear grupos, solicitar ingreso, invitar personas, aceptar o
  rechazar, salir, eliminar y un chat por grupo que se actualiza cada 5 s.
- **Notificaciones**: campana con contador, bandeja que se actualiza cada 30 s y
  aviso arriba cuando llega algo nuevo.
- **Perfil**: tus cifras, apariencia (claro / oscuro / sistema), tus grupos,
  lo que publicaste, en lo que participas y tus solicitudes.

## Cómo abrirlo

Necesitas **Node 22.13 o más nuevo** y la app **Expo Go** en el teléfono (o un
emulador de Android / simulador de iOS).

```bash
npm install
npm start
```

## Importante

La app debe abrirse en el puerto: 5123, de lo contrario no funcionara.

Escanea el código QR con Expo Go (Android) o con la cámara (iPhone). El teléfono
y el computador deben estar en la misma red; si no, usa `npx expo start --tunnel`.

No hace falta `.env`: la app ya apunta al proyecto de Roble de Campus Innovate.
Si quieres usar otro proyecto, copia `.env.example` como `.env`, cambia los
valores y reinicia con `npx expo start --clear`.

### Sin servidor (datos de demostración)

Para ver la app sin conexión a Roble, con un campus de ejemplo en memoria:

```bash
npm run start:local     # en el teléfono
npm run web:local       # en el navegador: http://localhost:5123
```

Entra con `mariana@uninorte.edu.co` / `Campus123!` (el login ya viene lleno).
Lo que hagas se pierde al cerrar la app.

### Comandos

| Comando                                     | Qué hace                                         |
| ------------------------------------------- | ------------------------------------------------ |
| `npm start`                                 | Servidor de desarrollo (Expo Go) contra Roble    |
| `npm run android` / `npm run ios`           | Abre directo en el emulador                      |
| `npm run web`                               | La app en el navegador, en http://localhost:5123 |
| `npm run start:local` / `npm run web:local` | La app con datos de demostración, sin servidor   |
| `npm run test:ci`                           | Todas las pruebas, una vez                       |
| `npm run typecheck`                         | TypeScript sin emitir                            |
| `npm run lint`                              | ESLint de Expo                                   |

## Arquitectura

La de r_market: arquitectura limpia **por feature**, con inyección de
dependencias. La lógica de cada pantalla vive en su **view model** —un hook
`useXxxViewModel` o, si es estado global, un contexto— que habla con la
**interfaz** del repositorio.

```
App.tsx                 fuentes, tema, DI, Paper, avisos, diálogos, sesión, notificaciones
src/
  core/
    di/                 contenedor, tokens, appContainer (Roble) y localContainer (memoria)
    roble/              cliente, configuración, tablas, guardRoble y política de contraseñas
    data/               LocalTables (un Roble en memoria con los mismos UNIQUE) y datos demo
    platform/           selector de archivos, abrir enlaces, regreso de Google (web)
    feedback/           avisos (snackbar) y diálogos de confirmación
    components/ ui/     piezas visuales compartidas (tarjetas, paneles, chips, degradados…)
    hooks/ utils/       sondeo periódico, recarga al volver, formatos, errores
  theme/                colores, tipografía (Sora + Inter) y preferencia claro/oscuro
  navigation/           stack raíz, 5 pestañas, barra inferior Material 3, rutas tipadas
  features/
    auth/               sesión, login, registro, Google
    users/              directorio app_users
    listings/           proyectos, valoraciones, comentarios, tareas, archivos, mentoría
    groups/             grupos, solicitudes, invitaciones, chat
    notifications/      avisos, quién recibe qué (NotificationPublisher), bandeja
    home/ profile/      Inicio y Perfil
```

Cada feature repite las mismas capas:

```
features/<nombre>/
  domain/         entities, repositories (interfaces) y su Failure
  data/
    datasources/  la interfaz, la remota (Roble) y la de memoria: hablan en filas
    repositories/ convierten filas en entidades, aplican las reglas y traducen errores
  presentation/   viewmodels/ o context/, screens/, components/
```

- **Las llamadas a Roble viven solo en `data/datasources/`.** Los datasources
  hablan en filas; los repositorios las convierten y deciden. Así cada
  repositorio se prueba con el datasource de memoria, que devuelve lo mismo que
  Roble y aplica los mismos `UNIQUE` compuestos.
- **Las reglas están en los repositorios**, no solo en la pantalla: solo el líder
  edita, un proyecto pausado no recibe solicitudes, el mentor no ocupa cupo,
  etc. Son las mismas de la versión Flutter.
- **El orden de escritura es el de Flutter**: Roble no tiene transacciones, así
  que cada pareja de escrituras va en el orden que deja un estado recuperable
  (por ejemplo, al aceptar una solicitud primero entra la persona y después se
  marca aceptada).

### Equivalencias con Flutter

| Flutter                             | React Native                                         |
| ----------------------------------- | ---------------------------------------------------- |
| `GetxController` + `Obx`            | hook `useXxxViewModel` con `useState`                |
| `Get.find` / `Bindings`             | `Container` + `useInject(TOKENS.X)`                  |
| `GetMaterialApp` + rutas con nombre | React Navigation (stack + pestañas)                  |
| `Get.snackbar` / `Get.dialog`       | `useSnackbar()` / `useConfirm()`                     |
| `FlexColorScheme` + Google Fonts    | `react-native-paper` (MD3) + `@expo-google-fonts`    |
| `Poller`                            | `usePoller` (se pausa si otra pantalla queda encima) |
| `flutter_secure_storage`            | AsyncStorage (vía `roble-client`)                    |
| `file_picker` / `url_launcher`      | `expo-document-picker` / `Linking`                   |
| `RobleClient` HTTP propio           | `roble-client` (npm)                                 |

## Cambios respecto a la versión Flutter

- **Solo teléfono.** El tablero de tareas usa siempre pestañas por columna (en
  Flutter, con pantalla ancha, se veían las cuatro columnas lado a lado), la
  orientación es vertical y en iOS no se ofrece para iPad.
- **Cliente de Roble.** En vez del cliente HTTP escrito a mano se usa
  `roble-client`, que ya renueva el token, guarda la sesión y sube archivos al
  bucket. El inicio con Google (iniciar y canjear el código) se hace con dos
  peticiones propias, igual que en Flutter.
- **Sesión sin red.** Como en Flutter, arrancar sin internet no cierra la
  sesión: se usa el último perfil guardado.
- **Recargar al volver.** Donde Flutter hacía `await Get.toNamed(...); load()`,
  aquí la pantalla vuelve a leer en silencio al recuperar el foco (sin
  mostrar el indicador de carga otra vez).
- **Tema.** Mismos colores (carmesí, azul marino y dorado), mismas fuentes y
  mismo modo claro / oscuro / sistema; los componentes son los de React Native
  Paper (Material 3), así que hay diferencias mínimas de detalle.
- **Datos de demostración.** Nuevo: `start:local` arranca la app entera sin
  servidor, con un campus de ejemplo, para trabajar en la interfaz o mostrarla.
- **Se quitó lo heredado de r_market** que no es de Campus Innovate: fotos de
  carros, «vender», seguir publicaciones y la tabla `listing_follow`.
- **Se corrigió la configuración**: el proyecto anterior leía
  `EXPO_PUBLIC_ROBOLE_*` (con un error de tipeo) mientras `.env.example` definía
  `EXPO_PUBLIC_ROBLE_*`, así que nunca encontraba la configuración.

## El esquema en Roble

Son las 16 tablas de la versión Flutter (ver su `docs/roble.md`): `listings`,
`listing_members`, `join_requests`, `listing_tasks`, `project_files`,
`mentorship_requests`, `groups`, `group_members`, `group_requests`,
`listing_reactions`, `listing_views`, `listing_comments`, `app_users`,
`group_invitations`, `group_messages` y `notifications`. Los nombres están en
`src/core/roble/tables.ts`. No hace falta crear nada: la app usa las que ya
existen.

## Pruebas

```bash
npm run test:ci
```

- `__tests__/unit`: formatos, política de contraseñas, reglas de proyectos,
  ranking y avance, repositorios de proyectos, grupos, chat, sesión y avisos
  (contra el Roble en memoria, con sus `UNIQUE`).
- `__tests__/integration`: la app entera con datos de demostración: entrar, ver
  Inicio y abrir un proyecto.
