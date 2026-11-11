import { Row } from "@/src/core/roble/guard";

export interface UserDataSource {
  readUsers(filters?: Record<string, string>): Promise<Row[]>;
  insertUser(row: Row): Promise<Row>;
  updateUser(id: string, changes: Row): Promise<void>;
  // `user_skills`: una fila por habilidad de cada persona.
  readSkills(filters?: Record<string, string>): Promise<Row[]>;
  insertSkill(row: Row): Promise<Row>;
  deleteSkill(id: string): Promise<void>;
}
