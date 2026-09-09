import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideBanknote } from '@lucide/angular';
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
  BdRevealDirective,
  BdSkeletonComponent,
} from 'bandeira-ui';

import { BarraVoltarComponent } from '../../components/barra-voltar/barra-voltar.component';
import { TituloPaginaComponent } from '../../components/titulo-pagina/titulo-pagina.component';
import { CategoriaIconComponent } from '../../core/catalog/categoria-icon.component';
import { CategoriaRendaService } from '../../core/catalog/categoria-renda.service';
import type { CategoriaRenda } from '../../core/catalog/categoria-renda.model';
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
    LucideBanknote,
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
    BdRevealDirective,
    BdSkeletonComponent,
    CategoriaIconComponent,
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
  protected form: RendaPayload = { ...FORM_VAZIO };

  ngOnInit(): void {
    forkJoin([this.rendaService.listar(), this.categoriaRendaService.listar()]).subscribe({
      next: () => this.carregando.set(false),
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar suas rendas.');
      },
    });
  }

  nomeCategoria(id: number | null): string | null {
    return this.categorias().find((c) => c.id === id)?.nome ?? null;
  }

  categoriaDe(id: number | null): CategoriaRenda | null {
    return this.categorias().find((c) => c.id === id) ?? null;
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
