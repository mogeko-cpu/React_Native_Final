// Quién tiene la sesión abierta, según `GET /me`. `id` es el `userId` de
// Roble: el valor que va en `creator_id`, `user_id`, `author_id`…
export type AuthUser = {
  id: string;
  name: string;
  email: string;
};
