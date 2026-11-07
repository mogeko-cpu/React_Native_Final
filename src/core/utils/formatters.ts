// Formatos que comparten varias pantallas. Los mismos de `core/` en Flutter.

// «ahora», «hace 5 min», «hace 3 h», «hace 2 d» (`time_ago.dart`).
export function timeAgo(moment: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - moment.getTime()) / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Un día como «4 nov», con el año solo si no es el actual (`day_format.dart`).
// Recibe `AAAA-MM-DD`: el día solo, sin zona horaria.
export function shortDay(day: string, now: Date = new Date()): string {
  const [year, month, date] = day.split("-").map((part) => parseInt(part, 10));
  const label = `${date} ${MONTHS[(month || 1) - 1]}`;
  return year === now.getFullYear() ? label : `${label} ${year}`;
}

// La fecha de hoy como `AAAA-MM-DD`, en la hora del teléfono.
export function todayDay(now: Date = new Date()): string {
  return dayOf(now);
}

export function dayOf(moment: Date): string {
  const two = (value: number) => String(value).padStart(2, "0");
  return `${moment.getFullYear()}-${two(moment.getMonth() + 1)}-${two(moment.getDate())}`;
}

// Iniciales para un avatar: «Mariana Ospina» → «MO».
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
  return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
}

// La hora de un mensaje: «3:05 p. m.».
export function timeOfDay(moment: Date): string {
  let hours = moment.getHours();
  const minutes = String(moment.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "p. m." : "a. m.";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}

// «12 KB», «1,5 MB»: el tamaño de un archivo como lo diría una persona.
export function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${Math.round(kilobytes)} KB`;
  const megabytes = kilobytes / 1024;
  if (megabytes >= 10) return `${Math.round(megabytes)} MB`;
  return `${megabytes.toFixed(1).replace(".", ",")} MB`;
}

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}
