import { UserFacingError } from "@/src/core/utils/failure";

export class AuthFailure extends UserFacingError {
  constructor(message: string) {
    super(message);
    this.name = "AuthFailure";
  }
}

// Entrar con una cuenta que aún no confirmó el correo: la pantalla de login la
// lleva a escribir el código en vez de solo mostrar el error.
export class UnverifiedEmailFailure extends AuthFailure {
  constructor(readonly email: string) {
    super("Tu cuenta aún no está verificada. Escribe el código que te llegó al correo.");
    this.name = "UnverifiedEmailFailure";
  }
}
