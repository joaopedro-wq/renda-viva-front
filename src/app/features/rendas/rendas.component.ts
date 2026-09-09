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
  LucideBanknote,
  LucideChevronLeft,
  LucideChevronRight,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';
import { forkJoin } from 'rxjs';
import {
  BdAlertComponent,
  BdButtonComponent,
  BdCardComponent,
  BdChipComponent,
  BdCheckboxComponent,
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
import { CategoriaRendaService } from '../../core/catalog/categoria-renda.service';
import type { CategoriaRenda } from '../../core/catalog/categoria-renda.model';
import { deslocarMes, mesAtual, rotuloMes } from '../../core/util/mes-referencia';
import { RendaService } from './data/renda.service';
import type { Renda, RendaPayload } from './data/renda.model';

const FORM_VAZIO: RendaPayload = {
  descricao: '',
  fonte: '',
  categoria_renda_id: null,
  valor: 0,
  data_recebimento: '',
  recorrente: false,
};

@Component({
  selector: 'app-rendas',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    LucideBanknote,
    LucideChevronLeft,
    LucideChevronRight,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
    BarraVoltarComponent,
    TituloPaginaComponent,
    BdAlertComponent,
    BdButtonComponent,
    BdCardComponent,
    BdChipComponent,
    BdCheckboxComponent,
    BdEmptyStateComponent,
    BdFieldComponent,
    BdInputComponent,
    BdModalComponent,
    BdRevealDirective,
    BdSkeletonComponent,
    CategoriaIconComponent,
    SelectInlineComponent,
  ],
  templateUrl: './rendas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RendasComponent implements OnInit {
  private readonly rendaService = inject(RendaService);
  private readonly categoriaRendaService = inject(CategoriaRendaService);

  protected readonly rendas = this.rendaService.rendas;
  protected readonly categorias = this.categoriaRendaService.categorias;
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  /** `null` = criando; id != null = editando essa renda. */
  protected readonly editandoId = signal<number | null>(null);
  protected readonly formularioAberto = signal(false);
  protected form: RendaPayload = { ...FORM_VAZIO };

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

  protected readonly rendasDoMes = computed(() => {
    const mes = this.mesSelecionado();

    return this.rendas().filter((r) => r.data_recebimento.startsWith(mes));
  });

  protected readonly totalDoMes = computed(() =>
    this.rendasDoMes().reduce((soma, r) => soma + Number(r.valor), 0),
  );

  protected readonly mesLabel = computed(() => rotuloMes(this.mesSelecionado()));

  /** Total por categoria no mês corrente, do maior pro menor — a barra de
   * composição do resumo. */
  protected readonly composicaoDoMes = computed(() => {
    const porCategoria = new Map<number | null, number>();

    for (const renda of this.rendasDoMes()) {
      porCategoria.set(
        renda.categoria_renda_id,
        (porCategoria.get(renda.categoria_renda_id) ?? 0) + Number(renda.valor),
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
    forkJoin([this.rendaService.listar(), this.categoriaRendaService.listar()]).subscribe({
      next: () => this.carregando.set(false),
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar suas rendas.');
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
    return this.categorias().find((c) => c.id === id)?.nome ?? null;
  }

  categoriaDe(id: number | null): CategoriaRenda | null {
    return this.categorias().find((c) => c.id === id) ?? null;
  }

  protected novaRenda(): void {
    this.editandoId.set(null);
    this.form = { ...FORM_VAZIO };
    this.formularioAberto.set(true);
  }

  editar(renda: Renda): void {
    this.editandoId.set(renda.id);
    this.form = {
      descricao: renda.descricao,
      fonte: renda.fonte,
      categoria_renda_id: renda.categoria_renda_id,
      valor: Number(renda.valor),
      data_recebimento: renda.data_recebimento,
      recorrente: renda.recorrente,
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
      ? this.rendaService.atualizar(id, this.form)
      : this.rendaService.criar(this.form);

    requisicao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.formularioAberto.set(false);
        this.cancelarEdicao();
      },
      error: () => {
        this.salvando.set(false);
        this.erro.set('Não foi possível salvar essa renda.');
      },
    });
  }

  excluir(renda: Renda): void {
    if (!confirm(`Excluir "${renda.descricao}"?`)) return;

    this.rendaService.excluir(renda.id).subscribe({
      error: () => this.erro.set('Não foi possível excluir essa renda.'),
    });
  }
}
