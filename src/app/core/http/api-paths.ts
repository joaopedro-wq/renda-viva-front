import { environment } from '../../../environments/environment';

/** Rotas públicas de auth — fora de `auth:sanctum`, sem Authorization. */
export const authPaths = {
  login: () => `${environment.apiUrl}/api/login`,
  register: () => `${environment.apiUrl}/api/criar-usuario`,
};

/** Rotas protegidas — sempre com `Authorization: Bearer <token>`. */
export const apiPaths = {
  me: () => `${environment.apiBaseUrl}/user/get-with-token`,
  logout: () => `${environment.apiBaseUrl}/logout`,
};
