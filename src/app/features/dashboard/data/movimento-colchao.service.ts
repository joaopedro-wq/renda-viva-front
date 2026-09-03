import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../../../core/http/api-paths';
import type { MovimentoColchao } from './movimento-colchao.model';

interface MovimentoColchaoCollectionResponse {
  data: MovimentoColchao[];
}

@Injectable({ providedIn: 'root' })
export class MovimentoColchaoService {
  private readonly http = inject(HttpClient);

  listar(mes?: string): Observable<MovimentoColchao[]> {
    const url = mes ? `${apiPaths.movimentosColchao()}?mes=${mes}` : apiPaths.movimentosColchao();

    return this.http.get<MovimentoColchaoCollectionResponse>(url).pipe(map((res) => res.data));
  }
}
