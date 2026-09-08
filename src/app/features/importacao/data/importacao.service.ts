import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, concatMap, map, range } from 'rxjs';

import { apiPaths } from '../../../core/http/api-paths';
import type {
  EventoUploadChunk,
  LinhaConfirmacaoPayload,
  MapeamentoPayload,
  PreVisualizarResponse,
  ResultadoConfirmacao,
  UploadChunkResponse,
} from './importacao.model';

const TAMANHO_CHUNK = 512 * 1024;

@Injectable({ providedIn: 'root' })
export class ImportacaoService {
  private readonly http = inject(HttpClient);

  preVisualizar(
    arquivo: File,
    opcoes: { modeloImportacaoId?: number; mapeamento?: MapeamentoPayload } = {},
  ): Observable<PreVisualizarResponse> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    this.anexarOpcoes(formData, opcoes);

    return this.http.post<PreVisualizarResponse>(apiPaths.importacoesPreVisualizar(), formData);
  }

  enviarPorChunks(
    arquivo: File,
    opcoes: { modeloImportacaoId?: number; mapeamento?: MapeamentoPayload } = {},
  ): Observable<EventoUploadChunk> {
    const totalChunks = Math.max(1, Math.ceil(arquivo.size / TAMANHO_CHUNK));

    return range(0, totalChunks).pipe(
      concatMap((indice) => this.enviarChunk(arquivo, indice, totalChunks, opcoes)),
    );
  }

  confirmar(linhas: LinhaConfirmacaoPayload[]): Observable<ResultadoConfirmacao> {
    return this.http
      .post<{ data: ResultadoConfirmacao }>(apiPaths.importacoesConfirmar(), { linhas })
      .pipe(map((res) => res.data));
  }

  private enviarChunk(
    arquivo: File,
    indice: number,
    totalChunks: number,
    opcoes: { modeloImportacaoId?: number; mapeamento?: MapeamentoPayload },
  ): Observable<EventoUploadChunk> {
    const inicio = indice * TAMANHO_CHUNK;
    const fim = Math.min(inicio + TAMANHO_CHUNK, arquivo.size);
    const ehUltimoChunk = indice === totalChunks - 1;

    const formData = new FormData();
    formData.append('arquivo', arquivo.slice(inicio, fim), arquivo.name);

    // modelo_importacao_id/mapeamento só fazem sentido junto do chunk final — é o único
    // que o back de fato processa (nos intermediários ele só confirma o recebimento).
    if (ehUltimoChunk) {
      this.anexarOpcoes(formData, opcoes);
    }

    const headers = new HttpHeaders({
      'Content-Range': `bytes ${inicio}-${fim - 1}/${arquivo.size}`,
    });

    return this.http
      .post<UploadChunkResponse>(apiPaths.importacoesUploadChunk(), formData, { headers })
      .pipe(
        map(
          (resposta): EventoUploadChunk =>
            'recebido' in resposta
              ? { tipo: 'progresso', percentual: Math.round(((indice + 1) / totalChunks) * 100) }
              : { tipo: 'concluido', resposta },
        ),
      );
  }

  private anexarOpcoes(
    formData: FormData,
    opcoes: { modeloImportacaoId?: number; mapeamento?: MapeamentoPayload },
  ): void {
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
  }
}
