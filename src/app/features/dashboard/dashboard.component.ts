import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { LucideHouse } from '@lucide/angular';
import {
  BdAlertComponent,
  BdCardComponent,
  BdCountUpDirective,
  BdMetricComponent,
  BdProgressComponent,
  BdRevealDirective,
  BdSkeletonComponent,
} from 'bandeira-ui';

import { TituloPaginaComponent } from '../../components/titulo-pagina/titulo-pagina.component';
import { HistoriaDoMesService } from './data/historia-do-mes.service';
import { PainelService } from './data/painel.service';
import type { DadoDaSemana } from './data/dado-da-semana.model';
import type { HistoriaDoMes } from './data/historia-do-mes.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    LucideHouse,
    TituloPaginaComponent,
    BdAlertComponent,
    BdCardComponent,
    BdCountUpDirective,
    BdMetricComponent,
    BdProgressComponent,
    BdRevealDirective,
    BdSkeletonComponent,
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly painelService = inject(PainelService);
  private readonly historiaDoMesService = inject(HistoriaDoMesService);

  protected readonly dado = signal<DadoDaSemana | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  protected readonly historia = signal<HistoriaDoMes | null>(null);
  protected readonly carregandoHistoria = signal(true);

  /**
   * Sem meta de colchão definida por usuário ainda (ver Stretch em
   * PROXIMAS-FEATURES.md) — a barra só sinaliza "tem reserva" ou não, não uma
   * porcentagem de uma meta que ainda não existe.
   */
  protected readonly colchaoPositivo = computed(() => Number(this.dado()?.saldo_colchao ?? 0) > 0);

  protected readonly valorSeguroSemana = computed(() =>
    Number(this.dado()?.valor_seguro_semana ?? 0),
  );
  protected readonly rendaRecebidaMes = computed(() =>
    Number(this.dado()?.renda_recebida_mes ?? 0),
  );
  protected readonly saldoColchao = computed(() => Number(this.dado()?.saldo_colchao ?? 0));

  ngOnInit(): void {
    this.painelService.buscarDadoDaSemana().subscribe({
      next: (dado) => {
        this.dado.set(dado);
        this.carregando.set(false);
        this.carregarHistoria(dado);
      },
      error: () => {
        this.carregando.set(false);
        this.carregandoHistoria.set(false);
        this.erro.set('Não foi possível carregar o painel da semana.');
      },
    });
  }

  private carregarHistoria(dado: DadoDaSemana): void {
    const mes = new Date().toISOString().slice(0, 7); // YYYY-MM

    this.historiaDoMesService.montar(dado, mes).subscribe({
      next: (historia) => {
        this.historia.set(historia);
        this.carregandoHistoria.set(false);
      },
      error: () => this.carregandoHistoria.set(false),
    });
  }
}
