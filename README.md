## Integrantes:

GONZALEZ QUINTANILLA SEBASTIAN.

PATERNINA ARZUZA ESTEFANIA.

TRIANA MARTINEZ LEONEL.

## Video:

Link: https://youtu.be/kB93CcpH0KY

## Contenido

1. [Resumen de la entrega](#1-resumen-de-la-entrega)
2. [Cambios respecto a la versión Flutter](#2-cambios-respecto-a-la-versión-flutter)
3. [Funcionalidades nuevas (lienzo v3)](#3-funcionalidades-nuevas-lienzo-v3)
4. [Qué hace la app](#4-qué-hace-la-app)
5. [Cómo abrirla](#5-cómo-abrirla)
6. [Arquitectura](#6-arquitectura)
7. [Roble: tablas y configuración](#7-roble-tablas-y-configuración)
8. [Pruebas](#8-pruebas)

---

## 1. Resumen de la entrega

| Se pidió                                        | Estado                                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Pasar Campus Innovate de Flutter a React Native | Todas las pantallas y reglas de la versión Flutter                                                             |
| Usar la arquitectura de r_market                | Clean architecture por feature, inyección de dependencias y view models                                        |
| App pensada para teléfono                       | Vertical, pestañas inferiores, sin versión para iPad                                                           |
| Conservar el backend                            | Mismo proyecto de Roble y las mismas 16 tablas                                                                 |
| Cinco flujos nuevos del lienzo de alineación v3 | Recuperar contraseña y verificar correo, habilidades y recomendados, guardar, compartir, Google en el teléfono |
| Mejoras de experiencia del lienzo               | Esqueletos de carga, reacciones al instante, deshacer, modo sin conexión, insignias y accesibilidad            |
| Pruebas                                         | 36 pruebas unitarias y de integración                                                                          |

---

## 2. Cambios respecto a la versión Flutter

### 2.1 Tecnología: qué reemplaza a qué

| Flutter                             | React Native                                             |
| ----------------------------------- | -------------------------------------------------------- |
| Dart                                | TypeScript                                               |
| `GetxController` + `Obx`            | hook `useXxxViewModel` con `useState`                    |
| `Get.find` / `Bindings`             | `Container` + `useInject(TOKENS.X)`                      |
| `GetMaterialApp` + rutas con nombre | React Navigation (stack + pestañas)                      |
| `Get.snackbar` / `Get.dialog`       | `useSnackbar()` / `useConfirm()`                         |
| `FlexColorScheme` + Google Fonts    | `react-native-paper` (Material 3) + `@expo-google-fonts` |
| `Poller`                            | `usePoller` (se pausa si otra pantalla queda encima)     |
| `flutter_secure_storage`            | AsyncStorage (vía `roble-client`)                        |
| `file_picker` / `url_launcher`      | `expo-document-picker` / `Linking`                       |
| `RobleClient` HTTP escrito a mano   | `roble-client` (npm)                                     |
| Pruebas de Flutter (`test/`)        | Jest + Testing Library (`__tests__/`)                    |

### 2.2 Lo que se mantiene igual

- **Pantallas y flujos**: Inicio, Explorar, Ranking, Grupos, Perfil, detalle del
  proyecto, tablero de tareas, archivos, mentoría, chat de grupo y
  notificaciones.
- **Reglas de negocio**: solo el líder edita, un proyecto pausado no recibe
  solicitudes, el mentor no ocupa cupo, etc. Viven en los repositorios, igual
  que en Flutter.
- **Orden de escritura**: Roble no tiene transacciones, así que cada pareja de
  escrituras va en el mismo orden que en Flutter, el que deja un estado
  recuperable si la segunda falla.
- **Identidad visual**: colores carmesí, azul marino y dorado; fuentes Sora e
  Inter; tema claro, oscuro o del sistema.
- **Sesión sin red**: arrancar sin internet no cierra la sesión.

### 2.3 Lo que cambió

| Cambio                | Flutter                                       | React Native                                                           |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| Plataforma            | Teléfono, tableta y web                       | Pensada para teléfono (también abre en el navegador)                   |
| Tablero de tareas     | En pantalla ancha, las 4 columnas lado a lado | Siempre una pestaña por columna                                        |
| Cliente de Roble      | Escrito a mano                                | `roble-client`, que renueva el token, guarda la sesión y sube archivos |
| Recargar al volver    | `await Get.toNamed(...); load()`              | La pantalla vuelve a leer en silencio al recuperar el foco             |
| Carga                 | Círculo girando                               | Esqueletos con la forma del contenido                                  |
| Registro              | Cuenta activa al instante (`signup-direct`)   | Roble manda un código y la cuenta se activa al escribirlo              |
| Google                | Solo en la web                                | En la web y, configurando Roble, en el teléfono                        |
| Datos de demostración | —                                             | `npm run start:local`: la app completa sin servidor                    |
| Componentes           | Material de Flutter                           | React Native Paper (Material 3); diferencias mínimas de detalle        |

### 2.4 Correcciones al proyecto de partida

- Se quitó lo heredado de r_market que no es de Campus Innovate: fotos de
  carros, «vender», seguir publicaciones y la tabla `listing_follow`.
- Se corrigió la configuración: el código leía `EXPO_PUBLIC_ROBOLE_*` (con un
  error de tipeo) mientras `.env.example` definía `EXPO_PUBLIC_ROBLE_*`, así que
  nunca encontraba la configuración.
- Todos los comandos usan el puerto 5123: la web abre siempre en
  http://localhost:5123.

---

## 3. Funcionalidades nuevas (lienzo v3)

El _Lienzo de alineación interdisciplinaria v3_ pedía migrar sin perder nada y
luego, por prioridad, cinco flujos nuevos y mejoras de experiencia. Nada de
esto existe en la versión Flutter.

### 3.1 Flujos nuevos

| #   | Flujo                                       | Cómo funciona                                                                                                                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Recuperar contraseña y verificar correo** | «¿Olvidaste tu contraseña?» en el login pide el correo; Roble manda un código y se escribe la contraseña nueva (sirve el código o el enlace completo del correo). La contraseña se revisa con la política de Roble antes de enviarla. Al crear cuenta llega un código de 6 dígitos; quien intente entrar sin confirmarlo va a la pantalla del código, con «Reenviar código». |
| 2   | **Habilidades y «Recomendados para ti»**    | En el Perfil se agregan y quitan habilidades, sin duplicados aunque se escriban distinto («Diseño UI» = «diseno ui»), con sugerencias de las que más piden los proyectos. Inicio muestra hasta 5 proyectos que buscan gente, donde la persona no está y que piden al menos una de sus habilidades; primero los que más coinciden.                                            |
| 3   | **Guardar proyectos**                       | Marcador en la barra del detalle; la lista aparece en el Perfil, en «Guardados».                                                                                                                                                                                                                                                                                             |
| 4   | **Compartir un proyecto**                   | En el teléfono abre el menú de compartir del sistema; en la web usa el del navegador o copia el enlace. El enlace (`/proyecto/<id>` o `campusinnovate://proyecto/<id>`) abre el detalle directamente.                                                                                                                                                                        |
| 5   | **Google en el teléfono**                   | Abre Google dentro de la app y vuelve con `campusinnovate://auth`. Requiere registrar ese destino en Roble (ver [sección 7](#7-roble-tablas-y-configuración)); mientras tanto el botón lo explica.                                                                                                                                                                           |

### 3.2 Mejoras de experiencia

- **Esqueletos de carga** en todas las pantallas que cargan. Respetan la opción
  del sistema «reducir movimiento».
- **Reacciones al instante**: me gusta / no me gusta cambia en el mismo toque y
  Roble se actualiza después; si falla, vuelve a lo que hay en el servidor.
  Guardar y las habilidades funcionan igual.
- **Deshacer** al rechazar una solicitud o quitar un archivo: el elemento
  desaparece y el aviso ofrece «Deshacer» durante 5 segundos antes de escribir
  en Roble.
- **Modo sin conexión**: sin red se muestra lo último que se cargó, con una
  franja arriba que lo avisa, y los cambios se rechazan con un mensaje claro.
- **Insignias de pendientes** en la barra inferior: Inicio (solicitudes a tus
  proyectos y mentorías que te pidieron) y Grupos (invitaciones y solicitudes a
  tus grupos).
- **Accesibilidad**: etiquetas para el lector de pantalla (por ejemplo «Me
  gusta, 3» o «Inicio, 2 pendientes»), títulos de sección marcados como
  encabezados, botones de al menos 44 px y contraste AA revisado en los dos
  temas.
- **Menos peticiones**: Inicio y Perfil leen los proyectos una sola vez y el
  detalle pide en paralelo lo que no depende entre sí.

---

## 4. Qué hace la app

- **Cuenta**: iniciar sesión, crear cuenta, verificar el correo, recuperar la
  contraseña y «Continuar con Google». La sesión se guarda al cerrar la app.
- **Inicio**: saludo, «Publicar idea», ideas destacadas, recomendados para ti,
  solicitudes de mentoría recibidas y tus proyectos.
- **Explorar**: búsqueda y filtros por categoría y estado (Idea, En curso,
  Pausado, Terminado).
- **Ranking**: proyectos ordenados por me gusta menos no me gusta; desempatan
  comentarios y vistas.
- **Detalle del proyecto**: solicitar unirse, valorar, comentar, guardar,
  compartir y ver el equipo con roles (líder, integrante, mentor). El líder
  además edita, elimina, responde solicitudes, cambia roles, quita personas y
  transfiere el liderazgo.
- **Espacio del equipo**: tablero de tareas (Por hacer, En progreso, Hecho,
  Cancelado) con responsable, fecha y avance; carpeta de archivos y enlaces
  (hasta 10 MB por archivo); y mentoría.
- **Grupos**: crear, solicitar ingreso, invitar, aceptar o rechazar, salir,
  eliminar y chat por grupo (se actualiza cada 5 s).
- **Notificaciones**: campana con contador y bandeja que se actualiza cada 30 s.
- **Perfil**: cifras, habilidades, guardados, apariencia, grupos, proyectos
  publicados, participaciones y solicitudes.

---

## 5. Cómo abrirla

Requisitos: **Node 22.13 o más nuevo** y la app **Expo Go** en el teléfono (o un
emulador de Android / simulador de iOS).

```bash
npm install
npm start          # teléfono: escanea el QR con Expo Go (Android) o la cámara (iPhone)
npm run web        # navegador: http://localhost:5123
```

El teléfono y el computador deben estar en la misma red; si no, usa
`npx expo start --tunnel`. No hace falta `.env`: la app ya apunta al proyecto
de Roble de Campus Innovate.

### Sin servidor (datos de demostración)

```bash
npm run start:local     # en el teléfono
npm run web:local       # en el navegador: http://localhost:5123
```

Cuenta: `mariana@uninorte.edu.co` / `Campus123!` (el login ya viene lleno). El
código para verificar una cuenta o recuperar la contraseña es `123456`. Lo que
se haga se pierde al cerrar la app.

### Comandos

| Comando                                     | Qué hace                                         |
| ------------------------------------------- | ------------------------------------------------ |
| `npm start`                                 | Servidor de desarrollo (Expo Go) contra Roble    |
| `npm run android` / `npm run ios`           | Abre directo en el emulador                      |
| `npm run web`                               | La app en el navegador, en http://localhost:5123 |
| `npm run start:local` / `npm run web:local` | La app con datos de demostración, sin servidor   |
| `npm run test:ci`                           | Todas las pruebas, una vez                       |
| `npm run typecheck`                         | Revisión de tipos de TypeScript                  |
| `npm run lint`                              | ESLint                                           |

---

## 6. Arquitectura

La de r_market: **clean architecture por feature** con inyección de
dependencias. Cada pantalla tiene su **view model** (un hook `useXxxViewModel`
o, si es estado global, un contexto) que solo conoce la **interfaz** del
repositorio.

```
App.tsx                 fuentes, tema, DI, avisos, diálogos, sesión, notificaciones
src/
  core/
    di/                 contenedor, tokens, appContainer (Roble) y localContainer (memoria)
    roble/              cliente, configuración, tablas, manejo de errores, política de contraseñas
    data/               LocalTables (un Roble en memoria con los mismos UNIQUE) y datos demo
    network/            estado de conexión y caché de lecturas (modo sin conexión)
    platform/           selector de archivos, abrir y compartir enlaces, Google
    feedback/           avisos con «Deshacer» y diálogos de confirmación
    components/ ui/     piezas visuales compartidas (tarjetas, chips, esqueletos…)
    hooks/ utils/       sondeo periódico, recarga al volver, formatos, errores
  theme/                colores, tipografía y preferencia claro/oscuro
  navigation/           stack raíz, 5 pestañas con insignias, enlaces, rutas tipadas
  features/
    auth/               sesión, login, registro, verificar correo, recuperar contraseña, Google
    users/              directorio de personas y habilidades
    listings/           proyectos, valoraciones, comentarios, tareas, archivos,
                        mentoría, guardados y recomendados
    groups/             grupos, solicitudes, invitaciones, chat
    notifications/      avisos y bandeja
    home/ profile/      Inicio y Perfil
```

Cada feature repite las mismas capas:

```
features/<nombre>/
  domain/         entidades, interfaces de repositorio y errores propios
  data/
    datasources/  interfaz + versión remota (Roble) + versión en memoria; hablan en filas
    repositories/ convierten filas en entidades, aplican reglas y traducen errores
  presentation/   view models, pantallas y componentes
```

- **Solo los datasources hablan con Roble.** Por eso cada repositorio se puede
  probar con el datasource en memoria, que responde igual que Roble y aplica
  las mismas restricciones `UNIQUE`.
- **Cambiar de Roble a datos de demostración solo cambia el datasource** en el
  contenedor (`appContainer` / `localContainer`): ni los repositorios ni las
  pantallas se enteran.

---

## 7. Roble: tablas y configuración

La app usa las 16 tablas de la versión Flutter (`listings`, `listing_members`,
`join_requests`, `listing_tasks`, `project_files`, `mentorship_requests`,
`groups`, `group_members`, `group_requests`, `listing_reactions`,
`listing_views`, `listing_comments`, `app_users`, `group_invitations`,
`group_messages` y `notifications`) y **dos nuevas** para los flujos del lienzo:

| Tabla            | Columnas                                                                 | Restricción                    |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------ |
| `user_skills`    | `user_id`, `skill`, `skill_key` (sin mayúsculas ni tildes), `created_at` | `UNIQUE (user_id, skill_key)`  |
| `saved_listings` | `user_id`, `listing_id`, `saved_at`                                      | `UNIQUE (user_id, listing_id)` |

Para activar todo:

1. **Crear las tablas nuevas**: en la Consola SQL de Roble ejecutar
   [`docs/sql/2026_habilidades_y_guardados.sql`](docs/sql/2026_habilidades_y_guardados.sql).
   Mientras no existan, el Perfil lo avisa y el resto de la app funciona igual.
2. **Correos**: verificar la cuenta y recuperar la contraseña usan los correos
   que manda Roble; no hay nada que configurar en la app.
3. **Google en el teléfono** (opcional): en Roble, agregar un destino de inicio
   social llamado `mobile` que apunte a `campusinnovate://auth`. Funciona en una
   compilación propia (`npx expo run:android` / `run:ios`); en Expo Go solo
   funciona Google en la web.
4. **Enlaces compartidos** (opcional): si la versión web está publicada, poner
   su dirección en `EXPO_PUBLIC_WEB_URL` (ver `.env.example`).

Los nombres de las tablas están en `src/core/roble/tables.ts`.

---

## 8. Pruebas

```bash
npm run test:ci
```

**36 pruebas**, todas pasan:

- **Unitarias** (`__tests__/unit`): formatos, política de contraseñas, reglas de
  proyectos, ranking y avance, repositorios de proyectos, grupos, chat, sesión
  y avisos, contra el Roble en memoria con sus `UNIQUE`. De las funciones
  nuevas: verificar correo, recuperar contraseña, habilidades, guardados,
  recomendados, reacciones al instante y modo sin conexión.
- **De integración** (`__tests__/integration`): la app completa con datos de
  demostración: entrar y abrir un proyecto; recuperar la contraseña y entrar
  con la nueva; ver recomendados, guardar un proyecto y reaccionar.
