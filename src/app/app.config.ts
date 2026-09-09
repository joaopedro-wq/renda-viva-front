import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideShellPalette, provideShellTheme } from 'bandeira-shell';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/http/auth.interceptor';
import { PALETAS, DEFAULT_PALETTE_ID } from './shell-palette.config';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: LOCALE_ID, useValue: 'pt' },
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideShellTheme(),
    provideShellPalette({ options: PALETAS, defaultId: DEFAULT_PALETTE_ID }),
    // Restaura a sessão (token -> usuário) antes da primeira navegação/guard
    // rodar, pra um refresh de página não jogar o usuário logado de volta pro
    // /login.
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      const result = auth.restoreSession();
      return new Promise<void>((resolve) =>
        result.subscribe({ next: () => resolve(), error: () => resolve() }),
      );
    }),
  ],
};
