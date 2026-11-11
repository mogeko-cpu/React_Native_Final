## Integrantes:

GONZALEZ QUINTANILLA SEBASTIAN.

PATERNINA ARZUZA ESTEFANIA.

TRIANA MARTINEZ LEONEL.

## Video:

Link: https://youtu.be/kB93CcpH0KY

## Qué hace

Igual que la versión Flutter, pantalla por pantalla:

- **Cuenta**: iniciar sesión, crear cuenta (con la política de contraseñas de
  Roble revisada antes de gastar un registro), **verificar el correo** con un
  código de 6 dígitos, **recuperar la contraseña** y «Continuar con Google» (en
  la web y, si Roble tiene registrado el destino, en el teléfono). La sesión se
  guarda y se restaura al abrir.
- **Inicio**: saludo, «Publicar idea», ideas destacadas (proyectos que buscan
  gente), **recomendados para ti** según tus habilidades, solicitudes de
  mentoría que te llegaron y tus proyectos.
- **Explorar**: búsqueda por título o descripción y filtros por categoría y por
  estado (Idea, En curso, Pausado, Terminado).
- **Ranking**: proyectos ordenados por me gusta − no me gusta; desempatan los
  comentarios y las vistas.
- **Detalle del proyecto**: solicitar unirse, valorar (me gusta / no me gusta,
  al instante), comentar, **guardar** y **compartir**, ver el equipo con roles
  (líder, integrante, mentor) y, si eres líder, editar, eliminar, responder
  solicitudes (rechazar se puede deshacer), cambiar roles, quitar personas y
  transferir el liderazgo.
- **Espacio del equipo**: tablero de tareas por columnas (Por hacer, En
  progreso, Hecho, Cancelado) con responsable, fecha límite y avance; carpeta de
  archivos y enlaces (hasta 10 MB por archivo, quitar se puede deshacer); y
  mentoría (pedirla a alguien del directorio, aceptarla o rechazarla).
- **Grupos**: crear grupos, solicitar ingreso, invitar personas, aceptar o
  rechazar, salir, eliminar y un chat por grupo que se actualiza cada 5 s.
- **Notificaciones**: campana con contador, bandeja que se actualiza cada 30 s y
  aviso arriba cuando llega algo nuevo.
- **Perfil**: tus cifras, **tus habilidades** (con sugerencias de lo que más
  piden los proyectos), **tus guardados**, apariencia (claro / oscuro /
  sistema), tus grupos, lo que publicaste, en lo que participas y tus
  solicitudes.
- **Barra de abajo**: insignias con lo que espera tu respuesta (solicitudes y
  mentorías en Inicio; invitaciones y solicitudes en Grupos).
- **Sin conexión**: se ve lo último que se cargó, con una franja que lo avisa, y
  los cambios se rechazan con un mensaje claro hasta que vuelva el internet.

## Cómo abrirlo

Necesitas **Node 22.13 o más nuevo** y la app **Expo Go** en el teléfono (o un
emulador de Android / simulador de iOS).

```bash
npm install
npm start
```

Escanea el código QR con Expo Go (Android) o con la cámara (iPhone). El teléfono
y el computador deben estar en la misma red; si no, usa `npx expo start --tunnel`.

No hace falta `.env`: la app ya apunta al proyecto de Roble de Campus Innovate.
Si quieres usar otro proyecto, copia `.env.example` como `.env`, cambia los
valores y reinicia con `npx expo start --clear`.

> **Antes de usar habilidades y guardados contra Roble**, crea sus dos tablas:
> abre la Consola SQL del proyecto en Roble y ejecuta
> [`docs/sql/2026_habilidades_y_guardados.sql`](docs/sql/2026_habilidades_y_guardados.sql).
> Mientras no existan, el Perfil lo dice y el resto de la app funciona igual.

### Sin servidor (datos de demostración)

Para ver la app sin conexión a Roble, con un campus de ejemplo en memoria:

```bash
npm run start:local     # en el teléfono
npm run web:local       # en el navegador: http://localhost:5123
```

Entra con `mariana@uninorte.edu.co` / `Campus123!` (el login ya viene lleno).
Lo que hagas se pierde al cerrar la app. En este modo no llega ningún correo:
el código para verificar una cuenta o recuperar la contraseña es `123456`.

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
    platform/           selector de archivos, abrir y compartir enlaces, Google (web y teléfono)
    network/            conexión con Roble y caché de lecturas para el modo sin conexión
    feedback/           avisos (snackbar, con «Deshacer»), diálogos de confirmación
    components/ ui/     piezas visuales compartidas (tarjetas, paneles, chips, esqueletos…)
    hooks/ utils/       sondeo periódico, recarga al volver, formatos, errores
  theme/                colores, tipografía (Sora + Inter) y preferencia claro/oscuro
  navigation/           stack raíz, 5 pestañas con insignias, enlaces (/proyecto/<id>), rutas tipadas
  features/
    auth/               sesión, login, registro, verificar correo, recuperar contraseña, Google
    users/              directorio app_users y habilidades (user_skills)
    listings/           proyectos, valoraciones, comentarios, tareas, archivos, mentoría,
                        guardados (saved_listings) y recomendados
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

## Cambios de esta iteración (lienzo v3)

El lienzo pedía migrar sin perder nada y, en este orden de prioridad, cinco
flujos nuevos y mejoras de experiencia en toda la app. Todo quedó hecho:

### Flujos nuevos

| #   | Flujo                                       | Cómo funciona                                                                                                                                                                                                                                                                                                                                                                   | Dónde está                                                                                                 |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **Recuperar contraseña y verificar correo** | «¿Olvidaste tu contraseña?» en el login pide el correo, Roble manda un código y se pone la contraseña nueva (se acepta el código o el enlace completo del correo). La contraseña se revisa con la política de Roble **antes** de gastar una petición. Crear cuenta ahora manda un código de 6 dígitos; entrar sin haberlo confirmado lleva a escribirlo, con «Reenviar código». | `features/auth`: `ForgotPasswordScreen`, `ResetPasswordScreen`, `VerifyEmailScreen`, `useAccountViewModel` |
| 2   | **Habilidades y «Recomendados para ti»**    | En el Perfil se agregan y quitan habilidades (sin duplicados aunque se escriban distinto: «Diseño UI» = «diseno ui») y se sugieren las que más piden los proyectos. Inicio muestra hasta 5 proyectos que buscan gente, donde no estás y que piden al menos una de tus habilidades; primero los que más coinciden.                                                               | `users/domain/skills.ts`, `UserRepository`, `listings/domain/recommendations.ts`, Inicio y Perfil          |
| 3   | **Guardar proyectos**                       | Marcador en la barra del detalle; la lista queda en el Perfil, en «Guardados». Los proyectos borrados se ignoran.                                                                                                                                                                                                                                                               | `SavedListingRepository` y sus datasources                                                                 |
| 4   | **Compartir un proyecto**                   | Botón compartir en el detalle: en el teléfono abre el menú del sistema; en la web usa el de compartir del navegador o copia el enlace. El enlace (`/proyecto/<id>` o `campusinnovate://proyecto/<id>`) abre el detalle directamente.                                                                                                                                            | `core/platform/Sharer.ts`, `navigation/linking.ts`                                                         |
| 5   | **Google en el teléfono**                   | Abre Google dentro de la app y vuelve con `campusinnovate://auth`. Necesita que en la consola de Roble exista un destino llamado `mobile` con esa dirección (ver abajo); mientras no esté, el botón lo dice en vez de abrir un navegador sin regreso.                                                                                                                           | `core/platform/SocialBrowser.ts`, `AuthRepositoryImpl`                                                     |

### Mejoras de experiencia

- **Esqueletos de carga** en todas las pantallas que cargan (tarjetas, filas,
  detalle y chat), en vez del círculo girando. Respetan «reducir movimiento».
- **Tirar para refrescar** en las listas (ya estaba y se conservó).
- **Reacciones al instante**: me gusta / no me gusta cambia en el mismo toque y
  Roble se entera después; si falla, se vuelve a lo que hay de verdad. Guardar
  y las habilidades del Perfil funcionan igual.
- **Deshacer** al rechazar una solicitud o quitar un archivo: la fila
  desaparece y el aviso ofrece «Deshacer» 5 segundos antes de escribir en Roble
  (Roble no tiene papelera, así que la escritura espera).
- **Modo sin conexión**: cada lectura guarda su última respuesta (en memoria y
  en el teléfono); sin red se muestra eso con una franja arriba, y las
  escrituras se rechazan con un mensaje claro. Se limpia al cerrar sesión.
- **Insignias de pendientes** en la barra de abajo: Inicio (solicitudes a tus
  proyectos y mentorías que te pidieron) y Grupos (invitaciones y solicitudes a
  tus grupos). Se cuentan de verdad, no por avisos sin leer.
- **Accesibilidad**: etiquetas para el lector de pantalla en botones de ícono,
  tarjetas, reacciones («Me gusta, 3»), pestañas («Inicio, 2 pendientes») y
  avisos; títulos de sección marcados como encabezados; botones de al menos
  44 px y zonas táctiles ampliadas en chips e íconos; y contraste AA revisado
  en los dos temas (el único texto dorado que no llegaba se oscureció).
- **Menos peticiones**: Inicio y Perfil leen los proyectos una sola vez, y el
  detalle pide en paralelo lo que no depende entre sí.

### Para activar todo contra Roble

1. **Tablas nuevas**: en la Consola SQL de Roble ejecuta
   [`docs/sql/2026_habilidades_y_guardados.sql`](docs/sql/2026_habilidades_y_guardados.sql)
   (`user_skills` y `saved_listings`, cada una con su `UNIQUE` compuesto, igual
   que las demás).
2. **Correo**: verificar la cuenta y recuperar la contraseña usan los correos
   que manda Roble; no hay nada que configurar en la app.
3. **Google en el teléfono** (opcional): en la consola de Roble, en los destinos
   del inicio de sesión social, agrega uno llamado `mobile` que apunte a
   `campusinnovate://auth`. Ese esquema existe en una compilación propia
   (`npx expo run:android` / `run:ios`); en Expo Go la dirección es `exp://…`,
   así que ahí sigue funcionando solo la web. El nombre se cambia con
   `EXPO_PUBLIC_ROBLE_SOCIAL_REDIRECT_MOBILE`.
4. **Enlaces compartidos desde el teléfono** (opcional): si la versión web está
   publicada, pon su dirección en `EXPO_PUBLIC_WEB_URL` para que los enlaces
   abran en cualquier navegador.

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
- **Puerto fijo**: todos los comandos usan el puerto 5123, así que la web abre
  siempre en http://localhost:5123.
- **Lo del lienzo v3**: verificar correo, recuperar contraseña, habilidades y
  recomendados, guardados, compartir, Google en el teléfono, esqueletos,
  reacciones al instante, deshacer, modo sin conexión, insignias y
  accesibilidad (detalle arriba). La versión Flutter no tiene nada de esto.
- **Registro con verificación**: Flutter creaba la cuenta activa al instante
  (`signup-direct`); aquí Roble manda un código y la cuenta se activa al
  escribirlo.
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
`group_invitations`, `group_messages` y `notifications`, que ya existen, más
las dos de esta iteración, que hay que crear una vez con
[`docs/sql/2026_habilidades_y_guardados.sql`](docs/sql/2026_habilidades_y_guardados.sql):

| Tabla            | Columnas                                                                                    | Restricción                    |
| ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------ |
| `user_skills`    | `user_id`, `skill` (como la escribió), `skill_key` (sin mayúsculas ni tildes), `created_at` | `UNIQUE (user_id, skill_key)`  |
| `saved_listings` | `user_id`, `listing_id`, `saved_at`                                                         | `UNIQUE (user_id, listing_id)` |

Los nombres están en `src/core/roble/tables.ts`.

## Pruebas

```bash
npm run test:ci
```

- `__tests__/unit`: formatos, política de contraseñas, reglas de proyectos,
  ranking y avance, repositorios de proyectos, grupos, chat, sesión y avisos
  (contra el Roble en memoria, con sus `UNIQUE`); y de esta iteración:
  verificar correo y recuperar contraseña, habilidades, guardados,
  recomendados, reacciones al instante y el modo sin conexión.
- `__tests__/integration`: la app entera con datos de demostración: entrar y
  abrir un proyecto; recuperar la contraseña y entrar con la nueva; ver
  recomendados, guardar un proyecto y reaccionar al instante.
