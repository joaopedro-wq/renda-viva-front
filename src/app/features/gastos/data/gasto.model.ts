export interface Gasto {
  id: number;
  descricao: string;
  valor: string;
  data: string;
  categoria_gasto_id: number | null;
  obrigacao_fixa_id: number | null;
}

export interface GastoPayload {
  descricao: string;
  valor: number;
  data: string;
  categoria_gasto_id: number | null;
  obrigacao_fixa_id: number | null;
}
