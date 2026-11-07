import { Row } from "../roble/guard";
import { Tables } from "../roble/tables";
import { LocalTables, newId } from "./LocalTables";

// Una cuenta de la app en memoria.
export type LocalAccount = { userId: string; name: string; email: string; password: string };

// Los datos de demostración de la app sin servidor: un campus pequeño con
// grupos, proyectos en distintos estados, un tablero, comentarios,
// valoraciones y avisos. Lo usan `localContainer.ts` y las pruebas.
export class DummyData {
  readonly tables = new LocalTables();
  readonly accounts: LocalAccount[] = [];
  // Quién tiene la sesión abierta en memoria.
  sessionUserId: string | null = null;
  // Los bytes de los archivos «subidos» al bucket de mentira.
  readonly files = new Map<string, { name: string; size: number; uploaderId: string }>();

  // La cuenta con la que se entra a la app local.
  static readonly demoEmail = "mariana@uninorte.edu.co";
  static readonly demoPassword = "Campus123!";

  constructor(seed = true) {
    if (seed) this.seed();
  }

  account(name: string, email: string, password = DummyData.demoPassword): LocalAccount {
    const account = { userId: newId(), name, email, password };
    this.accounts.push(account);
    this.tables.insert(Tables.appUsers, { user_id: account.userId, name, email, updated_at: ago(30 * DAY) });
    return account;
  }

  private seed() {
    const t = this.tables;
    const mariana = this.account("Mariana Ospina", DummyData.demoEmail);
    const andres = this.account("Andrés Pérez", "andres@uninorte.edu.co");
    const camila = this.account("Camila Rojas", "camila@uninorte.edu.co");
    const julian = this.account("Julián Herrera", "julian@uninorte.edu.co");
    const laura = this.account("Laura Gómez", "lgomez@uninorte.edu.co");
    this.account("Sebastián Mejía", "smejia@uninorte.edu.co");

    // ── Grupos ──
    const robotica = t.insert(Tables.groups, {
      name: "Semillero de Robótica",
      description: "Construimos prototipos con sensores y microcontroladores para problemas reales del campus.",
      owner_id: andres.userId,
      owner_name: andres.name,
      created_at: ago(40 * DAY),
    });
    const emprende = t.insert(Tables.groups, {
      name: "Club de Emprendimiento",
      description: "Ideas de negocio con impacto: validamos, prototipamos y buscamos aliados.",
      owner_id: camila.userId,
      owner_name: camila.name,
      created_at: ago(35 * DAY),
    });
    const verde = t.insert(Tables.groups, {
      name: "Uninorte Verde",
      description: "Proyectos de sostenibilidad y cuidado del medio ambiente dentro de la universidad.",
      owner_id: mariana.userId,
      owner_name: mariana.name,
      created_at: ago(20 * DAY),
    });
    const member = (group: Row, account: LocalAccount) =>
      t.insert(Tables.groupMembers, { group_id: group._id, user_id: account.userId, user_name: account.name, joined_at: ago(15 * DAY) });
    member(robotica, andres);
    member(robotica, mariana);
    member(robotica, julian);
    member(emprende, camila);
    member(emprende, andres);
    member(verde, mariana);
    member(verde, julian);

    // ── Proyectos ──
    const listing = (row: Row, members: [LocalAccount, string][]) => {
      const stored = t.insert(Tables.listings, row);
      for (const [account, role] of members) {
        t.insert(Tables.listingMembers, {
          listing_id: stored._id,
          user_id: account.userId,
          user_name: account.name,
          role,
          joined_at: row.created_at,
        });
      }
      return stored;
    };
    const tutorias = listing(
      {
        title: "Plataforma de tutorías entre pares",
        description:
          "Una app para que estudiantes de semestres avanzados acompañen a los de primeros semestres en las materias con más pérdida. Queremos medir si baja la deserción.",
        category: "Tecnología",
        creator_id: mariana.userId,
        creator_name: mariana.name,
        max_members: 5,
        required_skills: ["React Native", "Diseño UI", "Bases de datos"],
        group_id: robotica._id,
        group_name: robotica.name,
        status: "inProgress",
        created_at: ago(12 * DAY),
      },
      [
        [mariana, "leader"],
        [julian, "member"],
      ],
    );
    const sensor = listing(
      {
        title: "Sensor de calidad del aire",
        description:
          "Red de sensores de bajo costo para medir material particulado en los bloques del campus y publicar los datos abiertos cada hora.",
        category: "Investigación",
        creator_id: andres.userId,
        creator_name: andres.name,
        max_members: 3,
        required_skills: ["Arduino", "Python", "Estadística"],
        group_id: robotica._id,
        group_name: robotica.name,
        status: "idea",
        created_at: ago(6 * DAY),
      },
      [[andres, "leader"]],
    );
    const huerta = listing(
      {
        title: "Huerta urbana en el campus",
        description:
          "Convertir la terraza del bloque K en una huerta comunitaria con riego automatizado y compostaje de los residuos de la cafetería.",
        category: "Sostenibilidad",
        creator_id: mariana.userId,
        creator_name: mariana.name,
        max_members: 6,
        required_skills: ["Agronomía", "Logística"],
        group_id: verde._id,
        group_name: verde.name,
        status: "idea",
        created_at: ago(3 * DAY),
      },
      [
        [mariana, "leader"],
        [julian, "member"],
      ],
    );
    const mercado = listing(
      {
        title: "Mercado de emprendedores Uninorte",
        description:
          "Una feria mensual donde los emprendimientos estudiantiles venden sus productos y reciben asesoría de egresados.",
        category: "Emprendimiento",
        creator_id: camila.userId,
        creator_name: camila.name,
        max_members: 4,
        required_skills: ["Ventas", "Redes sociales"],
        group_id: emprende._id,
        group_name: emprende.name,
        status: "paused",
        created_at: ago(25 * DAY),
      },
      [
        [camila, "leader"],
        [andres, "member"],
      ],
    );
    listing(
      {
        title: "Mural colaborativo de la biblioteca",
        description:
          "Diseñamos y pintamos entre todos un mural sobre la historia del Caribe colombiano en la entrada de la biblioteca.",
        category: "Arte y Cultura",
        creator_id: camila.userId,
        creator_name: camila.name,
        max_members: 8,
        required_skills: ["Ilustración"],
        group_id: emprende._id,
        group_name: emprende.name,
        status: "done",
        created_at: ago(60 * DAY),
      },
      [[camila, "leader"]],
    );

    // ── Tablero de la plataforma de tutorías ──
    const task = (title: string, assignee: LocalAccount | null, status: string, due: string | null, days: number) =>
      t.insert(Tables.listingTasks, {
        listing_id: tutorias._id,
        title,
        assignee_id: assignee?.userId ?? "",
        assignee_name: assignee?.name ?? "",
        due_date: due,
        status,
        created_by: mariana.userId,
        created_at: ago(days * DAY),
      });
    task("Entrevistar a 10 estudiantes de primer semestre", mariana, "done", null, 11);
    task("Diseñar el flujo de agendar una tutoría", julian, "done", null, 10);
    task("Prototipo en Figma de la pantalla de inicio", julian, "doing", dayFromNow(2), 8);
    task("Modelo de datos en Roble", mariana, "doing", dayFromNow(-1), 7);
    task("Definir métricas de deserción con Bienestar", null, "todo", dayFromNow(9), 5);
    task("Probar con un grupo piloto", null, "todo", null, 2);

    // ── Valoraciones, vistas y comentarios ──
    const react = (l: Row, account: LocalAccount, value: number) =>
      t.insert(Tables.listingReactions, { listing_id: l._id, group_id: l.group_id, user_id: account.userId, value, created_at: ago(DAY) });
    const view = (l: Row, account: LocalAccount) =>
      t.insert(Tables.listingViews, { listing_id: l._id, group_id: l.group_id, user_id: account.userId, viewed_at: ago(DAY) });
    react(tutorias, andres, 1);
    react(tutorias, camila, 1);
    react(tutorias, laura, 1);
    react(sensor, mariana, 1);
    react(sensor, camila, 1);
    react(huerta, andres, 1);
    react(mercado, julian, -1);
    for (const account of [andres, camila, julian, laura]) view(tutorias, account);
    for (const account of [mariana, camila, julian]) view(sensor, account);
    for (const account of [andres, laura]) view(huerta, account);
    view(mercado, mariana);
    const comment = (l: Row, account: LocalAccount, body: string, hours: number) =>
      t.insert(Tables.listingComments, {
        listing_id: l._id,
        group_id: l.group_id,
        author_id: account.userId,
        author_name: account.name,
        body,
        created_at: ago(hours * HOUR),
      });
    comment(tutorias, andres, "¡Me encanta! Podrían integrarlo con el calendario de la universidad.", 30);
    comment(tutorias, laura, "Si necesitan datos de deserción por materia, Bienestar los tiene.", 5);
    comment(sensor, mariana, "¿Ya tienen dónde ubicar los primeros sensores?", 20);

    // ── Solicitudes, invitaciones y mentoría ──
    t.insert(Tables.joinRequests, {
      listing_id: tutorias._id,
      applicant_id: camila.userId,
      applicant_name: camila.name,
      motivation: "Estudio diseño y quiero ayudar con la experiencia de los tutores.",
      skills: "Figma, investigación de usuarios",
      availability: "6 horas, martes y jueves en la tarde",
      status: "pending",
      created_at: ago(2 * DAY),
    });
    t.insert(Tables.groupInvitations, {
      group_id: emprende._id,
      group_name: emprende.name,
      inviter_id: camila.userId,
      inviter_name: camila.name,
      invitee_id: mariana.userId,
      invitee_name: mariana.name,
      created_at: ago(DAY),
    });
    t.insert(Tables.mentorshipRequests, {
      listing_id: sensor._id,
      listing_title: sensor.title,
      requester_id: andres.userId,
      requester_name: andres.name,
      mentor_id: mariana.userId,
      mentor_name: mariana.name,
      message: "Tienes experiencia con bases de datos; nos ayudarías a organizar las mediciones.",
      created_at: ago(10 * HOUR),
    });
    t.insert(Tables.projectFiles, {
      listing_id: tutorias._id,
      name: "Carpeta del equipo en Drive",
      kind: "link",
      storage_id: "",
      url: "https://drive.google.com/",
      mime_type: "",
      size_bytes: 0,
      uploader_id: julian.userId,
      uploader_name: julian.name,
      created_at: ago(9 * DAY),
    });

    // ── Chat del semillero ──
    const message = (account: LocalAccount, body: string, minutes: number) =>
      t.insert(Tables.groupMessages, {
        group_id: robotica._id,
        sender_id: account.userId,
        sender_name: account.name,
        body,
        created_at: ago(minutes * 60000),
      });
    message(andres, "¿Nos vemos el jueves en el laboratorio?", 180);
    message(julian, "Yo puedo después de las 2.", 170);
    message(mariana, "Perfecto, llevo el prototipo.", 160);

    // ── Avisos de Mariana ──
    const notify = (type: string, title: string, body: string, target: string, targetId: string, minutes: number, read = false) =>
      t.insert(Tables.notifications, {
        recipient_id: mariana.userId,
        type,
        title,
        body,
        target_type: target,
        target_id: targetId,
        is_read: read ? 1 : 0,
        created_at: ago(minutes * 60000),
      });
    notify("invitationReceived", "Te invitaron a un grupo", `${camila.name} te invitó a unirte a "${emprende.name}".`, "group", emprende._id, 60 * 24);
    notify("mentorshipRequested", "Te pidieron ser mentor", `${andres.name} quiere que acompañes el proyecto "${sensor.title}".`, "listing", sensor._id, 60 * 10);
    notify("requestReceived", "Nueva solicitud para tu proyecto", `${camila.name} quiere unirse a "${tutorias.title}".`, "listing", tutorias._id, 60 * 48, true);
    notify("comment", `Nuevo comentario en "${tutorias.title}"`, `${laura.name}: Si necesitan datos de deserción por materia, Bienestar los tiene.`, "listing", tutorias._id, 60 * 5);
  }
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

function dayFromNow(days: number): string {
  const d = new Date(Date.now() + days * DAY);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}
