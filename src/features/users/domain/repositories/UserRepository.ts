import { DirectoryUser } from "../entities/DirectoryUser";

export interface UserRepository {
  // Anota (o actualiza) a quien acaba de entrar. Se llama desde Inicio, que es
  // donde terminan todas las formas de iniciar sesión.
  registerCurrentUser(user: DirectoryUser): Promise<void>;
  // Todo el directorio, por nombre.
  getUsers(): Promise<DirectoryUser[]>;
}
