import { IconName } from "./icons";

// Color e ícono de cada categoría (`category_style.dart`). Una categoría que no
// está en la lista toma el color principal y una bombilla.
const BY_NAME: Record<string, { color: string; icon: IconName }> = {
  Tecnología: { color: "#2F6FED", icon: "chip" },
  Investigación: { color: "#7A4FE0", icon: "flask-outline" },
  Sostenibilidad: { color: "#1E9E6B", icon: "leaf" },
  Emprendimiento: { color: "#E07A1E", icon: "rocket-launch-outline" },
  "Arte y Cultura": { color: "#D1447A", icon: "palette-outline" },
  "Impacto Social": { color: "#1B8B9E", icon: "hand-heart-outline" },
};

export function categoryStyleOf(category: string, primary: string): { color: string; icon: IconName } {
  return BY_NAME[category] ?? { color: primary, icon: "lightbulb-outline" };
}
