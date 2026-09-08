/** O que o usuário preenche pra mapear um formato de extrato que o back não reconheceu. */
export interface MapeamentoPayload {
  nome: string;
  coluna_data: string;
  coluna_valor: string;
  coluna_descricao: string;
  coluna_identificador: string | null;
  formato_data: string;
}

export type PreVisualizarResponse = PrecisaMapearResponse | ClassificacaoResponse;

export interface PrecisaMapearResponse {
  precisa_mapear: true;
  cabecalho: string[];
}

export interface ClassificacaoResponse {
  precisa_mapear: false;
  modelo_importacao_id: number;
  data: LinhaClassificada[];
}

export type TipoLancamento = 'renda' | 'gasto' | 'ignorar';

export interface LinhaClassificada {
  data: string;
  valor: number;
  descricao: string;
  identificador_externo: string | null;
  tipo_sugerido: TipoLancamento;
  /**
   * `categoria_gasto_id` quando `tipo_sugerido` é 'gasto' (por palavra-chave),
   * `categoria_renda_id` quando é 'renda' (aprendida do histórico dessa
   * mesma descrição) — nunca os dois ao mesmo tempo.
   */
  categoria_sugerida_id: number | null;
  ja_importado: boolean;
  motivo: 'par_lavado' | 'ja_importado' | null;
}

/** Uma linha na tela de revisão — o que o usuário confirma/edita antes de gravar. */
export interface LinhaRevisao extends LinhaClassificada {
  tipo: TipoLancamento;
  /** Categoria de gasto ou de renda, dependendo de `tipo`. */
  categoriaId: number | null;
}

export interface LinhaConfirmacaoPayload {
  data: string;
  valor: number;
  descricao: string;
  identificador_externo: string | null;
  tipo: 'renda' | 'gasto';
  categoria_gasto_id: number | null;
  categoria_renda_id: number | null;
}

export interface ResultadoConfirmacao {
  rendas_criadas: number;
  gastos_criados: number;
  ja_existiam: number;
}

/**
 * Estado que a tela de upload (`ImportacaoComponent`) entrega pro formulário pós-upload
 * (`FormImportacaoComponent`) assim que o `preVisualizar` inicial responde — decide se ele
 * abre direto na revisão ou pede o mapeamento de colunas primeiro.
 */
export type EstadoInicialImportacao =
  | { tipo: 'mapear'; cabecalho: string[] }
  | { tipo: 'revisar'; linhas: LinhaRevisao[] };

export type EstadoEnvio = 'ocioso' | 'arrastando' | 'enviando' | 'processando' | 'erro';
export type UploadChunkResponse = { recebido: true } | PreVisualizarResponse;

export type EventoUploadChunk =
  | { tipo: 'progresso'; percentual: number }
  | { tipo: 'concluido'; resposta: PreVisualizarResponse };
