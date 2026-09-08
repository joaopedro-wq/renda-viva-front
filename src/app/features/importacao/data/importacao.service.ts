import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiPaths } from '../../../core/http/api-paths';
import type {
  LinhaConfirmacaoPayload,
  MapeamentoPayload,
  PreVisualizarResponse,
  ResultadoConfirmacao,
} from './importacao.model';

@Injectable({ providedIn: 'root' })
export class ImportacaoService {
  private readonly http = inject(HttpClient);

  preVisualizar(
    arquivo: File,
    opcoes: { modeloImportacaoId?: number; mapeamento?: MapeamentoPayload } = {},
  ): Observable<PreVisualizarResponse> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    if (opcoes.modeloImportacaoId) {
      formData.append('modelo_importacao_id', String(opcoes.modeloImportacaoId));
    }

    if (opcoes.mapeamento) {
      formData.append('mapeamento[nome]', opcoes.mapeamento.nome);
      formData.append('mapeamento[coluna_data]', opcoes.mapeamento.coluna_data);
      formData.append('mapeamento[coluna_valor]', opcoes.mapeamento.coluna_valor);
      formData.append('mapeamento[coluna_descricao]', opcoes.mapeamento.coluna_descricao);
      formData.append('mapeamento[formato_data]', opcoes.mapeamento.formato_data);

      if (opcoes.mapeamento.coluna_identificador) {
        formData.append('mapeamento[coluna_identificador]', opcoes.mapeamento.coluna_identificador);
      }
    }

    return this.http.post<PreVisualizarResponse>(apiPaths.importacoesPreVisualizar(), formData);
  }

  confirmar(linhas: LinhaConfirmacaoPayload[]): Observable<ResultadoConfirmacao> {
    return this.http
      .post<{ data: ResultadoConfirmacao }>(apiPaths.importacoesConfirmar(), { linhas })
      .pipe(map((res) => res.data));
  }
}
