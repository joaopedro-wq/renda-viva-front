import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { apiPaths } from '../http/api-paths';
import type { CategoriaRenda } from './categoria-renda.model';

interface CategoriaRendaCollectionResponse {
  data: CategoriaRenda[];
}


@Injectable({ providedIn: 'root' })
export class CategoriaRendaService {
  private readonly http = inject(HttpClient);

  private readonly categoriasSignal = signal<CategoriaRenda[]>([]);
  readonly categorias = this.categoriasSignal.asReadonly();

  private carregada = false;

  /** Não refaz o request se já carregou uma vez — catálogo é estático. */
  listar(): Observable<CategoriaRenda[]> {
    if (this.carregada) {
      return new Observable((subscriber) => {
        subscriber.next(this.categoriasSignal());
        subscriber.complete();
      });
    }

    return this.http.get<CategoriaRendaCollectionResponse>(apiPaths.categoriasRenda()).pipe(
      map((res) => res.data),
      tap((categorias) => {
        this.categoriasSignal.set(categorias);
        this.carregada = true;
      }),
    );
  }
}
