import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../../../core/http/api-paths';
import type { DadoDaSemana } from './dado-da-semana.model';

interface DadoDaSemanaResponse {
  data: DadoDaSemana;
}

@Injectable({ providedIn: 'root' })
export class PainelService {
  private readonly http = inject(HttpClient);

  buscarDadoDaSemana(): Observable<DadoDaSemana> {
    return this.http
      .get<DadoDaSemanaResponse>(apiPaths.painelDadoDaSemana())
      .pipe(map((res) => res.data));
  }
}
