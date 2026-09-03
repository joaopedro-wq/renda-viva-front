export interface MovimentoColchao {
  id: number;
  valor: string;
  tipo: 'aporte_automatico' | 'aporte_manual' | 'saque_automatico' | 'saque_manual';
  descricao: string;
  data: string;
}
