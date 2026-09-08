import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BdAlertComponent,
  BdButtonComponent,
  BdFieldComponent,
  BdInputComponent,
} from 'bandeira-ui';
import {
  LucideArrowUpRight,
  LucideBriefcase,
  LucideCar,
  LucideChevronDown,
  LucideChevronUp,
  LucideClock,
  LucideEllipsis,
  LucideGamepad2,
  LucideGraduationCap,
  LucideHeart,
  LucideHeartPulse,
  LucideHouse,
  LucideInfo,
  LucideLaptop,
  LucidePercent,
  LucideReceipt,
  LucideRefreshCw,
  LucideRepeat,
  LucideSearch,
  LucideShoppingBag,
  LucideSparkles,
  LucideShoppingCart,
  LucideTrendingUp,
  LucideUtensils,
  LucideWallet,
} from '@lucide/angular';

import { CategoriaGastoService } from '../../../core/catalog/categoria-gasto.service';
import { CategoriaRendaService } from '../../../core/catalog/categoria-renda.service';
import { ImportacaoService } from '../data/importacao.service';
import type {
  EstadoInicialImportacao,
  LinhaConfirmacaoPayload,
  LinhaRevisao,
  MapeamentoPayload,
  ResultadoConfirmacao,
  TipoLancamento,
} from '../data/importacao.model';
import { SelectInlineComponent, type OpcaoSelectInline } from './select-inline.component';

type Etapa = 'mapeando' | 'revisando' | 'concluido';

interface GrupoDoDia {
  data: string;
  rotulo: string;
  netFormatado: string;
  netPositivo: boolean;
  linhas: LinhaRevisao[];
}

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const MAPEAMENTO_VAZIO: MapeamentoPayload = {
  nome: '',
  coluna_data: '',
  coluna_valor: '',
  coluna_descricao: '',
  coluna_identificador: null,
  formato_data: 'd/m/Y',
};

@Component({
  selector: 'app-form-importacao',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    BdAlertComponent,
    BdButtonComponent,
    BdFieldComponent,
    BdInputComponent,
    SelectInlineComponent,
    LucideArrowUpRight,
    LucideBriefcase,
    LucideCar,
    LucideChevronDown,
    LucideChevronUp,
    LucideClock,
    LucideEllipsis,
    LucideGamepad2,
    LucideGraduationCap,
    LucideHeart,
    LucideHeartPulse,
    LucideHouse,
    LucideInfo,
    LucideLaptop,
    LucidePercent,
    LucideReceipt,
    LucideRefreshCw,
    LucideRepeat,
    LucideSearch,
    LucideShoppingCart,
    LucideTrendingUp,
    LucideShoppingBag,
    LucideSparkles,
    LucideUtensils,
    LucideWallet,
  ],
  templateUrl: './form-importacao.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormImportacaoComponent implements OnInit {
  private readonly importacaoService = inject(ImportacaoService);
  private readonly categoriaGastoService = inject(CategoriaGastoService);
  private readonly categoriaRendaService = inject(CategoriaRendaService);

  protected readonly categoriasGasto = this.categoriaGastoService.categorias;
  protected readonly categoriasRenda = this.categoriaRendaService.categorias;

  protected readonly opcoesTipo: OpcaoSelectInline[] = [
    { valor: 'renda', rotulo: 'Renda', cor: 'var(--bd-primary)' },
    { valor: 'gasto', rotulo: 'Gasto', cor: 'var(--bd-danger)' },
    { valor: 'ignorar', rotulo: 'Ignorar', cor: 'var(--bd-fg-subtle)' },
  ];

  protected readonly opcoesCategoriaGasto = computed<OpcaoSelectInline[]>(() => [
    { valor: null, rotulo: 'Sem categoria' },
    ...this.categoriasGasto().map((c) => ({ valor: c.id, rotulo: c.nome, cor: c.cor })),
  ]);

  protected readonly opcoesCategoriaRenda = computed<OpcaoSelectInline[]>(() => [
    { valor: null, rotulo: 'Sem categoria' },
    ...this.categoriasRenda().map((c) => ({ valor: c.id, rotulo: c.nome, cor: c.cor })),
  ]);

  /** Arquivo já enviado pra `ImportacaoComponent` — reenviado aqui se o usuário reformular o mapeamento. */
  readonly arquivo = input.required<File>();
  readonly estadoInicial = input.required<EstadoInicialImportacao>();

  readonly voltar = output<void>();

  protected readonly etapa = signal<Etapa>('revisando');
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly cabecalho = signal<string[]>([]);
  protected mapeamento: MapeamentoPayload = { ...MAPEAMENTO_VAZIO };

  protected readonly linhas = signal<LinhaRevisao[]>([]);
  protected readonly resultado = signal<ResultadoConfirmacao | null>(null);

  ngOnInit(): void {
    const estadoInicial = this.estadoInicial();

    if (estadoInicial.tipo === 'mapear') {
      this.etapa.set('mapeando');
      this.cabecalho.set(estadoInicial.cabecalho);
      this.mapeamento = this.sugerirMapeamento(estadoInicial.cabecalho);

      return;
    }

    this.etapa.set('revisando');
    this.linhas.set(estadoInicial.linhas);
  }

  protected readonly linhasIncluidas = computed(() =>
    this.linhas().filter((l) => l.tipo !== 'ignorar'),
  );

  private readonly categoriasGastoPorId = computed(
    () => new Map(this.categoriasGasto().map((c) => [c.id, c])),
  );

  private readonly categoriasRendaPorId = computed(
    () => new Map(this.categoriasRenda().map((c) => [c.id, c])),
  );

  protected readonly filtro = signal('');

  /** Folha de resumo do mobile (fechada por padrão) — não existe equivalente no desktop. */
  protected readonly resumoAberto = signal(false);

  private readonly linhasFiltradas = computed(() => {
    const termo = this.filtro().trim().toLowerCase();

    return termo
      ? this.linhas().filter((l) => l.descricao.toLowerCase().includes(termo))
      : this.linhas();
  });

  protected readonly totalRenda = computed(() =>
    this.linhas()
      .filter((l) => l.tipo === 'renda')
      .reduce((soma, l) => soma + Math.abs(l.valor), 0),
  );

  protected readonly totalGasto = computed(() =>
    this.linhas()
      .filter((l) => l.tipo === 'gasto')
      .reduce((soma, l) => soma + Math.abs(l.valor), 0),
  );

  protected readonly totalIgnoradas = computed(
    () => this.linhas().length - this.linhasIncluidas().length,
  );

  private readonly totalIgnoradasValor = computed(() =>
    this.linhas()
      .filter((l) => l.tipo === 'ignorar')
      .reduce((soma, l) => soma + Math.abs(l.valor), 0),
  );

  /** Proporção de cada grupo sobre o total movimentado no extrato — vira a barrinha do resumo. */
  protected readonly composicao = computed(() => {
    const total = this.totalRenda() + this.totalGasto() + this.totalIgnoradasValor();

    if (total === 0) return { renda: 0, gasto: 0, ignorada: 0 };

    return {
      renda: (this.totalRenda() / total) * 100,
      gasto: (this.totalGasto() / total) * 100,
      ignorada: (this.totalIgnoradasValor() / total) * 100,
    };
  });

  /** Quantas linhas continuam exatamente como a sugestão automática chegou — pra mostrar no banner. */
  protected readonly sugestoesAplicadas = computed(
    () => this.linhas().filter((l) => this.ehSugestao(l)).length,
  );

  /** Agrupa preservando a ordem em que as linhas chegam — o extrato já vem cronológico. */
  protected readonly gruposPorDia = computed(() => {
    const grupos: GrupoDoDia[] = [];
    const indicePorData = new Map<string, number>();

    for (const linha of this.linhasFiltradas()) {
      let indice = indicePorData.get(linha.data);

      if (indice === undefined) {
        indice = grupos.length;
        indicePorData.set(linha.data, indice);
        grupos.push({
          data: linha.data,
          rotulo: this.formatarData(linha.data),
          netFormatado: '',
          netPositivo: true,
          linhas: [],
        });
      }

      grupos[indice].linhas.push(linha);
    }

    for (const grupo of grupos) {
      const net = grupo.linhas
        .filter((l) => l.tipo !== 'ignorar')
        .reduce(
          (soma, l) => soma + (l.tipo === 'renda' ? Math.abs(l.valor) : -Math.abs(l.valor)),
          0,
        );

      grupo.netPositivo = net >= 0;
      grupo.netFormatado = `${net >= 0 ? '+' : '−'} R$ ${Math.abs(net).toFixed(2)}`;
    }

    return grupos;
  });

  confirmarMapeamento(): void {
    if (this.enviando()) return;

    this.enviando.set(true);
    this.erro.set(null);

    this.importacaoService
      .preVisualizar(this.arquivo(), { mapeamento: this.mapeamento })
      .subscribe({
        next: (resposta) => {
          this.enviando.set(false);

          if (resposta.precisa_mapear) {
            this.cabecalho.set(resposta.cabecalho);
            this.etapa.set('mapeando');

            return;
          }

          this.linhas.set(
            resposta.data.map((linha) => ({
              ...linha,
              tipo: linha.tipo_sugerido,
              categoriaId: linha.categoria_sugerida_id,
            })),
          );
          this.etapa.set('revisando');
        },
        error: () => {
          this.enviando.set(false);
          this.erro.set('Não foi possível aplicar esse mapeamento. Confira as colunas escolhidas.');
        },
      });
  }

  confirmarImportacao(): void {
    if (this.enviando()) return;

    const payload: LinhaConfirmacaoPayload[] = this.linhasIncluidas().map((linha) => ({
      data: linha.data,
      valor: linha.valor,
      descricao: linha.descricao,
      identificador_externo: linha.identificador_externo,
      tipo: linha.tipo as 'renda' | 'gasto',
      categoria_gasto_id: linha.tipo === 'gasto' ? linha.categoriaId : null,
      categoria_renda_id: linha.tipo === 'renda' ? linha.categoriaId : null,
    }));

    this.enviando.set(true);
    this.erro.set(null);

    this.importacaoService.confirmar(payload).subscribe({
      next: (resultado) => {
        this.enviando.set(false);
        this.resultado.set(resultado);
        this.etapa.set('concluido');
      },
      error: () => {
        this.enviando.set(false);
        this.erro.set('Não foi possível confirmar a importação.');
      },
    });
  }

  protected cancelar(): void {
    this.voltar.emit();
  }

  protected definirTipo(linha: LinhaRevisao, tipo: TipoLancamento): void {
    this.linhas.update((atual) => atual.map((l) => (l === linha ? { ...l, tipo } : l)));
  }

  protected definirCategoria(linha: LinhaRevisao, categoriaId: number | null): void {
    this.linhas.update((atual) => atual.map((l) => (l === linha ? { ...l, categoriaId } : l)));
  }

  private sugerirMapeamento(cabecalho: string[]): MapeamentoPayload {
    const encontrar = (candidatos: string[]) =>
      cabecalho.find((coluna) => candidatos.some((c) => coluna.toLowerCase().includes(c))) ?? '';

    return {
      nome: '',
      coluna_data: encontrar(['data']),
      coluna_valor: encontrar(['valor']),
      coluna_descricao: encontrar(['descri']),
      coluna_identificador: encontrar(['identificador']) || null,
      formato_data: 'd/m/Y',
    };
  }

  protected descricaoExibida(linha: LinhaRevisao): string {
    const partes = linha.descricao.split(' - ');
    const ultima = partes[partes.length - 1].trim();

    return partes.length > 1 && ultima ? ultima : linha.descricao;
  }

  protected ehSugestao(linha: LinhaRevisao): boolean {
    return (
      linha.motivo === null &&
      linha.tipo === linha.tipo_sugerido &&
      linha.categoriaId === linha.categoria_sugerida_id
    );
  }

  protected categoriaGasto(id: number | null) {
    return id ? (this.categoriasGastoPorId().get(id) ?? null) : null;
  }

  protected categoriaRenda(id: number | null) {
    return id ? (this.categoriasRendaPorId().get(id) ?? null) : null;
  }

  /** Cor do avatar da linha: categoria escolhida (gasto ou renda), neutro pro resto. */
  protected corAvatar(linha: LinhaRevisao): string {
    if (linha.tipo === 'gasto') {
      return this.categoriaGasto(linha.categoriaId)?.cor ?? '#8a8a8a';
    }

    if (linha.tipo === 'renda') {
      return this.categoriaRenda(linha.categoriaId)?.cor ?? '#16a34a';
    }

    return '#8a8a8a';
  }

  /** Mesmo padrão de sinal + formatação do resumo e do saldo por dia — nunca o valor cru do back. */
  protected formatarValor(linha: LinhaRevisao): string {
    const absoluto = Math.abs(linha.valor).toFixed(2);

    if (linha.tipo === 'ignorar') return `R$ ${absoluto}`;

    return `${linha.tipo === 'renda' ? '+' : '−'} R$ ${absoluto}`;
  }

  /**
   * Renda usa a cor da paleta ativa (`--bd-primary`) em vez de verde — segue a paleta escolhida
   * (Índigo, Calmo, Coral...) e o tema claro/escuro de graça. Gasto é sempre vermelho (`--bd-danger`).
   */
  protected corTipo(linha: LinhaRevisao): string {
    if (linha.tipo === 'renda') return 'var(--bd-primary)';
    if (linha.tipo === 'gasto') return 'var(--bd-danger)';

    return 'var(--bd-fg-muted)';
  }

  protected estiloTipoBg(linha: LinhaRevisao): string {
    if (linha.tipo === 'renda') return 'var(--bd-primary-soft)';
    if (linha.tipo === 'gasto') return 'var(--bd-danger-soft)';

    return 'var(--bd-surface-hover)';
  }

  protected estiloTipoCor(linha: LinhaRevisao): string {
    return this.corTipo(linha);
  }

  private formatarData(data: string): string {
    const [, mes, dia] = data.split('-').map(Number);

    return `${dia} de ${MESES[mes - 1]}`;
  }
}
