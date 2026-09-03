import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { apiPaths } from '../http/api-paths';
import type { CategoriaGasto } from './categoria-gasto.model';

interface CategoriaGastoCollectionResponse {
  data: CategoriaGasto[];
}

@Injectable({ providedIn: 'root' })
export class CategoriaGastoService {
  private readonly http = inject(HttpClient);

  private readonly categoriasSignal = signal<CategoriaGasto[]>([]);
  readonly categorias = this.categoriasSignal.asReadonly();

  private carregada = false;

  listar(): Observable<CategoriaGasto[]> {
    if (this.carregada) {
      return new Observable((subscriber) => {
        subscriber.next(this.categoriasSignal());
        subscriber.complete();
      });
    }

    return this.http.get<CategoriaGastoCollectionResponse>(apiPaths.categoriasGasto()).pipe(
      map((res) => res.data),
      tap((categorias) => {
        this.categoriasSignal.set(categorias);
        this.carregada = true;
      }),
    );
  }
}
