import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { apiPaths } from '../../../core/http/api-paths';
import type { Renda, RendaPayload } from './renda.model';

interface RendaResponse {
  data: Renda;
}

interface RendaCollectionResponse {
  data: Renda[];
}

@Injectable({ providedIn: 'root' })
export class RendaService {
  private readonly http = inject(HttpClient);

  private readonly rendasSignal = signal<Renda[]>([]);
  readonly rendas = this.rendasSignal.asReadonly();

  listar(): Observable<Renda[]> {
    return this.http.get<RendaCollectionResponse>(apiPaths.rendas()).pipe(
      map((res) => res.data),
      tap((rendas) => this.rendasSignal.set(rendas)),
    );
  }

  criar(payload: RendaPayload): Observable<Renda> {
    return this.http.post<RendaResponse>(apiPaths.rendas(), payload).pipe(
      map((res) => res.data),
      tap((renda) => this.rendasSignal.update((atual) => [renda, ...atual])),
    );
  }

  atualizar(id: number, payload: RendaPayload): Observable<Renda> {
    return this.http.put<RendaResponse>(apiPaths.rendas(id), payload).pipe(
      map((res) => res.data),
      tap((renda) =>
        this.rendasSignal.update((atual) => atual.map((r) => (r.id === id ? renda : r))),
      ),
    );
  }

  excluir(id: number): Observable<void> {
    return this.http
      .delete<void>(apiPaths.rendas(id))
      .pipe(tap(() => this.rendasSignal.update((atual) => atual.filter((r) => r.id !== id))));
  }
}
