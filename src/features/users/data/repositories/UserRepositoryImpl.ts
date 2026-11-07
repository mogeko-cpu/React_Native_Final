import { guardRoble, isDuplicateRow, nowIso, Row, str, translateRobleError } from "@/src/core/roble/guard";
import { UserFacingError } from "@/src/core/utils/failure";
import { DirectoryUser } from "../../domain/entities/DirectoryUser";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { UserDataSource } from "../datasources/UserDataSource";

const failure = (message: string) => new UserFacingError(message);

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
}

function toUser(row: Row): DirectoryUser | null {
  const id = str(row.user_id);
  if (!id) return null;
  return { id, name: str(row.name, "Estudiante"), email: str(row.email) };
}
