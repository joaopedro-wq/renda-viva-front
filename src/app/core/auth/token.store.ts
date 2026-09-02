import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'renda-viva-token';

/**
 * Guarda o token em `localStorage` + um signal em memória — quem lê, lê do
 * signal (síncrono, usado pelo `authInterceptor` em toda requisição). Sem
 * Capacitor/Preferences por ora (MVP web-only); se um app nativo entrar
 * depois, ver `token.store.ts` do vitality-front como referência de migração
 * pra armazenamento assíncrono seguro.
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly tokenSignal = signal<string | null>(this.readInitial());
  readonly token = this.tokenSignal.asReadonly();

  set(token: string): void {
    this.tokenSignal.set(token);
    try {
      localStorage.setItem(STORAGE_KEY, token);
    } catch {
      // localStorage indisponível — segue só em memória.
    }
  }

  clear(): void {
    this.tokenSignal.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // idem.
    }
  }

  private readInitial(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
