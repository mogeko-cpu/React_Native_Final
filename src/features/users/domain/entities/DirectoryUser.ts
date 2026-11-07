// Una persona del directorio `app_users` (`app_user.dart`). Roble guarda las
// cuentas en su servicio de autenticación y no tiene ninguna llamada que las
// liste: cada quien se anota aquí al abrir la app.
export type DirectoryUser = {
  id: string;
  name: string;
  email: string;
};
