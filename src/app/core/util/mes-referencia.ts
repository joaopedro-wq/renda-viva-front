/**
 * Mês de referência como string `"YYYY-MM"` — o mesmo formato do prefixo de
 * `data`/`data_recebimento` vindos da API, então filtrar uma lista por mês é
 * só `lista.filter((item) => item.data.startsWith(mes))`. Usado em Gastos e
 * Rendas pra dar o mesmo filtro/navegação de mês nas duas telas.
 */

export function mesAtual(): string {
  return mesDe(new Date());
}

export function mesDe(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/** `deslocarMes('2026-09', -1) === '2026-08'` */
export function deslocarMes(mes: string, delta: number): string {
  const [ano, mesIndice] = mes.split('-').map(Number);

  return mesDe(new Date(ano, mesIndice - 1 + delta, 1));
}

/** `"setembro de 2026"` — minúsculo de propósito, pra encaixar em frases tipo
 * "Composição de {{ mesLabel() }}"; onde precisar maiúscula isolada (o rótulo
 * do seletor de mês), usar a classe `first-letter:uppercase` no template —
 * `text-transform: capitalize` capitalizaria também o "de". */
export function rotuloMes(mes: string): string {
  const [ano, mesIndice] = mes.split('-').map(Number);

  return new Date(ano, mesIndice - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}
