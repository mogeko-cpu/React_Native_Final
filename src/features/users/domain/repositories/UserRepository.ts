import { DirectoryUser } from "../entities/DirectoryUser";

export interface UserRepository {
  // Anota (o actualiza) a quien acaba de entrar. Se llama desde Inicio, que es
  // donde terminan todas las formas de iniciar sesión.
  registerCurrentUser(user: DirectoryUser): Promise<void>;
  // Todo el directorio, por nombre.
  getUsers(): Promise<DirectoryUser[]>;
  // Las habilidades que alguien puso en su Perfil, en el orden en que las
  // agregó. Con ellas Inicio arma «Recomendados para ti».
  getSkills(userId: string): Promise<string[]>;
  // Agregar una que ya está (escrita distinto) no hace nada.
  addSkill(userId: string, skill: string): Promise<void>;
  removeSkill(userId: string, skill: string): Promise<void>;
}
