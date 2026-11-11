// Las habilidades se escriben a mano («React native», «react Native ») y se
// comparan sin mayúsculas, tildes ni espacios de más. La llave normalizada es
// la que lleva el `UNIQUE (user_id, skill_key)`: así nadie tiene la misma
// habilidad dos veces aunque la escriba distinto.
export const MAX_SKILL_LENGTH = 40;
export const MAX_SKILLS = 20;

export function cleanSkill(skill: string): string {
  return skill.replace(/\s+/g, " ").trim().slice(0, MAX_SKILL_LENGTH);
}

export function skillKey(skill: string): string {
  return cleanSkill(skill)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export const sameSkill = (a: string, b: string) => skillKey(a) === skillKey(b);
