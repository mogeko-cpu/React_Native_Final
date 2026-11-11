import { byDateAsc, guardRoble, isDuplicateRow, nowIso, Row, str, translateRobleError } from "@/src/core/roble/guard";
import { UserFacingError } from "@/src/core/utils/failure";
import { DirectoryUser } from "../../domain/entities/DirectoryUser";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { cleanSkill, MAX_SKILLS, skillKey } from "../../domain/skills";
import { UserDataSource } from "../datasources/UserDataSource";

const failure = (message: string) => new UserFacingError(message);
const MISSING_TABLE = "Falta la tabla user_skills en Roble: córrela desde docs/sql/2026_habilidades_y_guardados.sql.";

export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly source: UserDataSource) {}

  async registerCurrentUser(user: DirectoryUser): Promise<void> {
    const rows = await guardRoble(() => this.source.readUsers({ user_id: user.id }), failure);
    if (rows.length > 0) {
      const row = rows[0];
      // Ya está y al día: no se gasta una escritura.
      if (str(row.name) === user.name && str(row.email) === user.email) return;
      const id = str(row._id);
      if (!id) return;
      await guardRoble(() => this.source.updateUser(id, { name: user.name, email: user.email, updated_at: nowIso() }), failure);
      return;
    }
    try {
      await this.source.insertUser({ user_id: user.id, name: user.name, email: user.email, updated_at: nowIso() });
    } catch (e) {
      // Otra pestaña lo anotó primero: es lo que se quería.
      if (isDuplicateRow(e)) return;
      throw translateRobleError(e, failure);
    }
  }

  async getUsers(): Promise<DirectoryUser[]> {
    const rows = await guardRoble(() => this.source.readUsers(), failure);
    return rows
      .map(toUser)
      .filter((u): u is DirectoryUser => u != null)
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  }

  async getSkills(userId: string): Promise<string[]> {
    const rows = await guardRoble(() => this.source.readSkills({ user_id: userId }), failure, { notFound: MISSING_TABLE });
    return rows.sort(byDateAsc("created_at")).map((r) => str(r.skill)).filter(Boolean);
  }

  async addSkill(userId: string, skill: string): Promise<void> {
    const clean = cleanSkill(skill);
    if (!clean) throw failure("Escribe la habilidad.");
    const rows = await guardRoble(() => this.source.readSkills({ user_id: userId }), failure, { notFound: MISSING_TABLE });
    if (rows.some((r) => str(r.skill_key) === skillKey(clean))) return;
    if (rows.length >= MAX_SKILLS) throw failure(`Puedes tener hasta ${MAX_SKILLS} habilidades.`);
    try {
      await this.source.insertSkill({ user_id: userId, skill: clean, skill_key: skillKey(clean), created_at: nowIso() });
    } catch (e) {
      // Ya estaba (otra pestaña la agregó primero): es lo que se quería.
      if (isDuplicateRow(e)) return;
      throw translateRobleError(e, failure, { notFound: MISSING_TABLE });
    }
  }

  async removeSkill(userId: string, skill: string): Promise<void> {
    const rows = await guardRoble(() => this.source.readSkills({ user_id: userId, skill_key: skillKey(skill) }), failure, { notFound: MISSING_TABLE });
    for (const row of rows) {
      const id = str(row._id);
      if (id) await guardRoble(() => this.source.deleteSkill(id), failure);
    }
  }
}

function toUser(row: Row): DirectoryUser | null {
  const id = str(row.user_id);
  if (!id) return null;
  return { id, name: str(row.name, "Estudiante"), email: str(row.email) };
}
