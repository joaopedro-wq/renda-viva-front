import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { apiPaths } from '../../../core/http/api-paths';
import type { Gasto, GastoPayload } from './gasto.model';

interface GastoResponse {
  data: Gasto;
}

interface GastoCollectionResponse {
  data: Gasto[];
}

@Injectable({ providedIn: 'root' })
export class GastoService {
  private readonly http = inject(HttpClient);

  private readonly gastosSignal = signal<Gasto[]>([]);
  readonly gastos = this.gastosSignal.asReadonly();

  listar(mes?: string): Observable<Gasto[]> {
    const url = mes ? `${apiPaths.gastos()}?mes=${mes}` : apiPaths.gastos();

    return this.http.get<GastoCollectionResponse>(url).pipe(
      map((res) => res.data),
      tap((gastos) => this.gastosSignal.set(gastos)),
    );
  }

  criar(payload: GastoPayload): Observable<Gasto> {
    return this.http.post<GastoResponse>(apiPaths.gastos(), payload).pipe(
      map((res) => res.data),
      tap((gasto) => this.gastosSignal.update((atual) => [gasto, ...atual])),
    );
  }

  atualizar(id: number, payload: GastoPayload): Observable<Gasto> {
    return this.http.put<GastoResponse>(apiPaths.gastos(id), payload).pipe(
      map((res) => res.data),
      tap((gasto) =>
        this.gastosSignal.update((atual) => atual.map((g) => (g.id === id ? gasto : g))),
      ),
    );
  }

  excluir(id: number): Observable<void> {
    return this.http
      .delete<void>(apiPaths.gastos(id))
      .pipe(tap(() => this.gastosSignal.update((atual) => atual.filter((g) => g.id !== id))));
  }
}
