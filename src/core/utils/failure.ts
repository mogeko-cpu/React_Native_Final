// Lo que un repositorio lanza para la persona: un mensaje en español, listo
// para mostrar. Cada feature tiene el suyo (`ListingFailure`, `GroupFailure`…),
// igual que en Flutter cada una tenía su `…Exception implements
// UserFacingException`.
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

// El mensaje de un error para mostrarlo. Lo que no es de la app (un fallo de
// programación, un objeto raro) no se le muestra a nadie tal cual.
export function messageOf(error: unknown, fallback = "Algo salió mal. Intenta de nuevo."): string {
  if (error instanceof UserFacingError) return error.message;
  return fallback;
}
