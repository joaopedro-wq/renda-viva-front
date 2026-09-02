import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { authPaths, apiPaths } from '../http/api-paths';
import { TokenStore } from './token.store';
import type { User } from './user.model';

interface LoginResponse {
  status: string;
  token: string;
  user: User;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStore = inject(TokenStore);

  private readonly currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenStore.token());

  private readonly bootstrappedSignal = signal(false);
  readonly bootstrapped = this.bootstrappedSignal.asReadonly();

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(authPaths.login(), { email, password }).pipe(
      tap((res) => {
        this.tokenStore.set(res.token);
        this.currentUserSignal.set(res.user);
      })
    );
  }

  register(name: string, email: string, password: string, passwordConfirmation: string) {
    return this.http.post(authPaths.register(), {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  }

  /** Chamado uma vez no boot — hidrata o usuário a partir do token salvo. */
  restoreSession(): Observable<User | null> {
    if (!this.tokenStore.token()) {
      this.markBootstrapped();
      return of(null);
    }

    return this.http.get<{ data: User }>(apiPaths.me()).pipe(
      map((res) => res.data),
      tap((user) => {
        this.currentUserSignal.set(user);
        this.markBootstrapped();
      }),
      catchError(() => {
        this.tokenStore.clear();
        this.currentUserSignal.set(null);
        this.markBootstrapped();
        return of(null);
      })
    );
  }

  markBootstrapped(): void {
    this.bootstrappedSignal.set(true);
  }

  logout(): Observable<unknown> {
    return this.http.post(apiPaths.logout(), {}).pipe(
      catchError(() => of(null)),
      tap(() => {
        this.tokenStore.clear();
        this.currentUserSignal.set(null);
      })
    );
  }
}
