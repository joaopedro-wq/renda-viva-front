import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { CategoriaGastoService } from '../../../core/catalog/categoria-gasto.service';
import type { CategoriaGasto } from '../../../core/catalog/categoria-gasto.model';
import { GastoService } from '../../gastos/data/gasto.service';
import type { Gasto } from '../../gastos/data/gasto.model';
import { MovimentoColchaoService } from './movimento-colchao.service';
import type { MovimentoColchao } from './movimento-colchao.model';
import type { DadoDaSemana } from './dado-da-semana.model';
import type { HistoriaDoMes } from './historia-do-mes.model';

@Injectable({ providedIn: 'root' })
export class HistoriaDoMesService {
  private readonly gastoService = inject(GastoService);
  private readonly categoriaGastoService = inject(CategoriaGastoService);
  private readonly movimentoColchaoService = inject(MovimentoColchaoService);

  montar(dado: DadoDaSemana, mes: string): Observable<HistoriaDoMes> {
    return forkJoin([
      this.gastoService.listar(mes),
      this.categoriaGastoService.listar(),
      this.movimentoColchaoService.listar(mes),
    ]).pipe(
      map(([gastos, categorias, movimentos]) =>
        this.construir(dado, gastos, categorias, movimentos),
      ),
    );
  }

  private construir(
    dado: DadoDaSemana,
    gastos: Gasto[],
    categorias: CategoriaGasto[],
    movimentos: MovimentoColchao[],
  ): HistoriaDoMes {
    return {
      fraseResumo: `Este mês você recebeu R$ ${dado.renda_recebida_mes} e gastou R$ ${dado.gastos_mes}.`,
      fraseCategoria: this.fraseCategoriaQueMaisPesou(gastos, categorias),
      fraseColchao: this.fraseMovimentoColchao(movimentos),
    };
  }

  private fraseCategoriaQueMaisPesou(gastos: Gasto[], categorias: CategoriaGasto[]): string | null {
    const totalPorCategoria = new Map<number, number>();

    for (const gasto of gastos) {
      if (!gasto.categoria_gasto_id) continue;
      const atual = totalPorCategoria.get(gasto.categoria_gasto_id) ?? 0;
      totalPorCategoria.set(gasto.categoria_gasto_id, atual + Number(gasto.valor));
    }

    if (totalPorCategoria.size === 0) return null;

    const [idTop, valorTop] = [...totalPorCategoria.entries()].sort((a, b) => b[1] - a[1])[0];
    const nome = categorias.find((c) => c.id === idTop)?.nome ?? 'sem nome';

    return `A categoria que mais pesou foi ${nome}, com R$ ${valorTop.toFixed(2)}.`;
  }

  private fraseMovimentoColchao(movimentos: MovimentoColchao[]): string {
    if (movimentos.length === 0) {
      return 'O colchão não teve nenhum movimento este mês.';
    }

    // Backend já devolve ordenado por data desc — o primeiro é o mais recente.
    const [ultimo] = movimentos;
    const valorAbsoluto = Math.abs(Number(ultimo.valor)).toFixed(2);

    return Number(ultimo.valor) > 0
      ? `O colchão recebeu um aporte de R$ ${valorAbsoluto} este mês.`
      : `O colchão teve um saque de R$ ${valorAbsoluto} este mês.`;
  }
}
