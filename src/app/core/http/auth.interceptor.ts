import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { TokenStore } from '../auth/token.store';

/** Só anexa Authorization em requests pra apiBaseUrl — nunca nas rotas de auth. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(TokenStore);
  const token = tokenStore.token();

  if (!token || !req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
