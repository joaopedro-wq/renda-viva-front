export interface Renda {
  id: number;
  descricao: string;
  fonte: string;
  valor: string;
  data_recebimento: string;
  recorrente: boolean;
}

export interface RendaPayload {
  descricao: string;
  fonte: string;
  valor: number;
  data_recebimento: string;
  recorrente: boolean;
}
