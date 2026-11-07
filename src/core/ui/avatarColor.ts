// El color de un avatar sale del nombre, siempre el mismo para el mismo nombre
// (`avatar_color.dart`). Suma los códigos en vez de un hash: solo tiene que ser
// estable y repartir los nombres por la paleta.
const PALETTE = ["#2F6FED", "#1E9E6B", "#E07A1E", "#7A4FE0", "#D1447A", "#1B8B9E", "#B0793F", "#4C6FA8"];

export function avatarColorOf(name: string): string {
  if (!name) return PALETTE[0];
  let seed = 0;
  for (let i = 0; i < name.length; i++) seed += name.charCodeAt(i);
  return PALETTE[seed % PALETTE.length];
}
