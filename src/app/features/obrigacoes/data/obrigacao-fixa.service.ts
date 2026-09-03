import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { apiPaths } from '../../../core/http/api-paths';
import type { ObrigacaoFixa, ObrigacaoFixaPayload } from './obrigacao-fixa.model';

interface ObrigacaoFixaResponse {
  data: ObrigacaoFixa;
}

interface ObrigacaoFixaCollectionResponse {
  data: ObrigacaoFixa[];
}

@Injectable({ providedIn: 'root' })
export class ObrigacaoFixaService {
  private readonly http = inject(HttpClient);

  private readonly obrigacoesSignal = signal<ObrigacaoFixa[]>([]);
  readonly obrigacoes = this.obrigacoesSignal.asReadonly();

  listar(): Observable<ObrigacaoFixa[]> {
    return this.http.get<ObrigacaoFixaCollectionResponse>(apiPaths.obrigacoesFixas()).pipe(
      map((res) => res.data),
      tap((obrigacoes) => this.obrigacoesSignal.set(obrigacoes)),
    );
  }

  criar(payload: ObrigacaoFixaPayload): Observable<ObrigacaoFixa> {
    return this.http.post<ObrigacaoFixaResponse>(apiPaths.obrigacoesFixas(), payload).pipe(
      map((res) => res.data),
      tap((obrigacao) => this.obrigacoesSignal.update((atual) => [obrigacao, ...atual])),
    );
  }

  atualizar(id: number, payload: ObrigacaoFixaPayload): Observable<ObrigacaoFixa> {
    return this.http.put<ObrigacaoFixaResponse>(apiPaths.obrigacoesFixas(id), payload).pipe(
      map((res) => res.data),
      tap((obrigacao) =>
        this.obrigacoesSignal.update((atual) => atual.map((o) => (o.id === id ? obrigacao : o))),
      ),
    );
  }

  excluir(id: number): Observable<void> {
    return this.http
      .delete<void>(apiPaths.obrigacoesFixas(id))
      .pipe(tap(() => this.obrigacoesSignal.update((atual) => atual.filter((o) => o.id !== id))));
  }
}
