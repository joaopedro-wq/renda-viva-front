import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucidePencil,
  LucidePlus,
  LucideShoppingCart,
  LucideTrash2,
} from '@lucide/angular';
import { forkJoin } from 'rxjs';
import {
  BdAlertComponent,
  BdButtonComponent,
  BdCardComponent,
  BdEmptyStateComponent,
  BdFieldComponent,
  BdInputComponent,
  BdModalComponent,
  BdRevealDirective,
  BdSkeletonComponent,
} from 'bandeira-ui';

import { BarraVoltarComponent } from '../../components/barra-voltar/barra-voltar.component';
import {
  SelectInlineComponent,
  type OpcaoSelectInline,
} from '../../components/select-inline/select-inline.component';
import { TituloPaginaComponent } from '../../components/titulo-pagina/titulo-pagina.component';
import { CategoriaIconComponent } from '../../core/catalog/categoria-icon.component';
import { CategoriaGastoService } from '../../core/catalog/categoria-gasto.service';
import type { CategoriaGasto } from '../../core/catalog/categoria-gasto.model';
import { deslocarMes, mesAtual, rotuloMes } from '../../core/util/mes-referencia';
import { GastoService } from './data/gasto.service';
import type { Gasto, GastoPayload } from './data/gasto.model';

const FORM_VAZIO: GastoPayload = {
  descricao: '',
  valor: 0,
  data: '',
  categoria_gasto_id: null,
  obrigacao_fixa_id: null,
};

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    LucideChevronLeft,
    LucideChevronRight,
    LucidePencil,
    LucidePlus,
    LucideShoppingCart,
    LucideTrash2,
    BarraVoltarComponent,
    TituloPaginaComponent,
    BdAlertComponent,
    BdButtonComponent,
    BdCardComponent,
    BdEmptyStateComponent,
    BdFieldComponent,
    BdInputComponent,
    BdModalComponent,
    BdRevealDirective,
    BdSkeletonComponent,
    CategoriaIconComponent,
    SelectInlineComponent,
  ],
  templateUrl: './gastos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GastosComponent implements OnInit {
  private readonly gastoService = inject(GastoService);
  private readonly categoriaGastoService = inject(CategoriaGastoService);

  protected readonly gastos = this.gastoService.gastos;
  protected readonly categorias = this.categoriaGastoService.categorias;
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly editandoId = signal<number | null>(null);
  protected readonly formularioAberto = signal(false);
  protected form: GastoPayload = { ...FORM_VAZIO };

  private readonly categoriaObjetoPorId = computed(
    () => new Map(this.categorias().map((c) => [c.id, c])),
  );

  /** Mesmo padrão colorido do `app-select-inline` já usado na revisão de
   * importação — padronizado aqui pra Gastos e Rendas terem a mesma cara. */
  protected readonly opcoesCategoria = computed<OpcaoSelectInline[]>(() => [
    { valor: null, rotulo: 'Sem categoria' },
    ...this.categorias().map((c) => ({ valor: c.id, rotulo: c.nome, cor: c.cor })),
  ]);

  /** `"YYYY-MM"` do mês em exibição — começa no mês corrente, navegável. */
  protected readonly mesSelecionado = signal(mesAtual());

  protected readonly gastosDoMes = computed(() => {
    const mes = this.mesSelecionado();

    return this.gastos().filter((g) => g.data.startsWith(mes));
  });

  protected readonly totalDoMes = computed(() =>
    this.gastosDoMes().reduce((soma, g) => soma + Number(g.valor), 0),
  );

  protected readonly mesLabel = computed(() => rotuloMes(this.mesSelecionado()));

  /** Total por categoria no mês corrente, do maior pro menor — a barra de
   * composição do resumo. */
  protected readonly composicaoDoMes = computed(() => {
    const porCategoria = new Map<number | null, number>();

    for (const gasto of this.gastosDoMes()) {
      porCategoria.set(
        gasto.categoria_gasto_id,
        (porCategoria.get(gasto.categoria_gasto_id) ?? 0) + Number(gasto.valor),
      );
    }

    const total = this.totalDoMes();

    return [...porCategoria.entries()]
      .map(([id, valorTotal]) => {
        const categoria = id !== null ? this.categoriaObjetoPorId().get(id) : null;

        return {
          nome: categoria?.nome ?? 'Sem categoria',
          cor: categoria?.cor ?? '#8a8a8a',
          total: valorTotal,
          percentual: total > 0 ? Math.round((valorTotal / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  });

  ngOnInit(): void {
    forkJoin([this.gastoService.listar(), this.categoriaGastoService.listar()]).subscribe({
      next: () => this.carregando.set(false),
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar seus gastos.');
      },
    });
  }

  protected mesAnterior(): void {
    this.mesSelecionado.update((atual) => deslocarMes(atual, -1));
  }

  protected mesSeguinte(): void {
    this.mesSelecionado.update((atual) => deslocarMes(atual, 1));
  }

  nomeCategoria(id: number | null): string | null {
    return id ? (this.categoriaObjetoPorId().get(id)?.nome ?? null) : null;
  }

  categoriaDe(id: number | null): CategoriaGasto | null {
    return id ? (this.categoriaObjetoPorId().get(id) ?? null) : null;
  }

  protected novoGasto(): void {
    this.editandoId.set(null);
    this.form = { ...FORM_VAZIO };
    this.formularioAberto.set(true);
  }

  editar(gasto: Gasto): void {
    this.editandoId.set(gasto.id);
    this.form = {
      descricao: gasto.descricao,
      valor: Number(gasto.valor),
      data: gasto.data,
      categoria_gasto_id: gasto.categoria_gasto_id,
      obrigacao_fixa_id: gasto.obrigacao_fixa_id,
    };
    this.formularioAberto.set(true);
  }

  protected onFormularioOpenChange(aberto: boolean): void {
    this.formularioAberto.set(aberto);
    if (!aberto) this.cancelarEdicao();
  }

  cancelarEdicao(): void {
    this.editandoId.set(null);
    this.form = { ...FORM_VAZIO };
  }

  salvar(): void {
    if (this.salvando()) return;

    this.erro.set(null);
    this.salvando.set(true);

    const id = this.editandoId();
    const requisicao = id
      ? this.gastoService.atualizar(id, this.form)
      : this.gastoService.criar(this.form);

    requisicao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.formularioAberto.set(false);
        this.cancelarEdicao();
      },
      error: () => {
        this.salvando.set(false);
        this.erro.set('Não foi possível salvar esse gasto.');
      },
    });
  }

  excluir(gasto: Gasto): void {
    if (!confirm(`Excluir "${gasto.descricao}"?`)) return;

    this.gastoService.excluir(gasto.id).subscribe({
      error: () => this.erro.set('Não foi possível excluir esse gasto.'),
    });
  }
}
