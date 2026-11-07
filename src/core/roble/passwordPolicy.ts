// La política de contraseñas de ROBLE, verificada **antes** de pedir la cuenta:
// una contraseña rechazada gasta uno de los 5 registros por hora igual.
// `%` o `*` no sirven aunque parezcan más fuertes.
export const PasswordPolicy = {
  minLength: 8,
  symbols: "!@#$_-.",

  validate(password: string): string | null {
    if (password.length < this.minLength) return `La contraseña debe tener al menos ${this.minLength} caracteres.`;
    if (!/[A-Z]/.test(password)) return "La contraseña debe incluir una letra mayúscula.";
    if (!/[a-z]/.test(password)) return "La contraseña debe incluir una letra minúscula.";
    if (!/[0-9]/.test(password)) return "La contraseña debe incluir un número.";
    if (!/[!@#$_\-.]/.test(password)) return `La contraseña debe incluir uno de estos símbolos: ${this.symbols}`;
    return null;
  },
};
