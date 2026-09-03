export interface ObrigacaoFixa {
  id: number;
  descricao: string;
  valor: string;
  dia_vencimento: number;
  ativa: boolean;
}

export interface ObrigacaoFixaPayload {
  descricao: string;
  valor: number;
  dia_vencimento: number;
  ativa: boolean;
}
