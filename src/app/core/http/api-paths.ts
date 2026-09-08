import { environment } from '../../../environments/environment';

export const authPaths = {
  login: () => `${environment.apiUrl}/api/login`,
  register: () => `${environment.apiUrl}/api/criar-usuario`,
};

export const apiPaths = {
  me: () => `${environment.apiBaseUrl}/user/get-with-token`,
  logout: () => `${environment.apiBaseUrl}/logout`,
  rendas: (id?: number) => `${environment.apiBaseUrl}/rendas${id ? `/${id}` : ''}`,
  gastos: (id?: number) => `${environment.apiBaseUrl}/gastos${id ? `/${id}` : ''}`,
  obrigacoesFixas: (id?: number) =>
    `${environment.apiBaseUrl}/obrigacoes-fixas${id ? `/${id}` : ''}`,
  categoriasGasto: () => `${environment.apiBaseUrl}/categorias-gasto`,
  categoriasRenda: () => `${environment.apiBaseUrl}/categorias-renda`,
  movimentosColchao: () => `${environment.apiBaseUrl}/movimentos-colchao`,
  painelDadoDaSemana: () => `${environment.apiBaseUrl}/painel/dado-da-semana`,
  importacoesPreVisualizar: () => `${environment.apiBaseUrl}/importacoes/pre-visualizar`,
  importacoesConfirmar: () => `${environment.apiBaseUrl}/importacoes/confirmar`,
};
