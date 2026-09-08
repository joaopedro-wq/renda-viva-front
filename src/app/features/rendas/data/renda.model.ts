export interface Renda {
  id: number;
  descricao: string;
  fonte: string;
  categoria_renda_id: number | null;
  valor: string;
  data_recebimento: string;
  recorrente: boolean;
}

export interface RendaPayload {
  descricao: string;
  fonte: string;
  categoria_renda_id: number | null;
  valor: number;
  data_recebimento: string;
  recorrente: boolean;
}
