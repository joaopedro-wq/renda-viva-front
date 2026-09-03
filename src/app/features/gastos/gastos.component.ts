import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  BdAlertComponent,
  BdButtonComponent,
  BdCardComponent,
  BdEmptyStateComponent,
  BdFieldComponent,
  BdInputComponent,
  BdPageHeaderComponent,
} from 'bandeira-ui';

import { CategoriaGastoService } from '../../core/catalog/categoria-gasto.service';
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
    BdAlertComponent,
    BdButtonComponent,
    BdCardComponent,
    BdEmptyStateComponent,
    BdFieldComponent,
    BdInputComponent,
    BdPageHeaderComponent,
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
  protected form: GastoPayload = { ...FORM_VAZIO };

  private readonly categoriasPorId = computed(
    () => new Map(this.categorias().map((c) => [c.id, c.nome])),
  );

  ngOnInit(): void {
    forkJoin([this.gastoService.listar(), this.categoriaGastoService.listar()]).subscribe({
      next: () => this.carregando.set(false),
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar seus gastos.');
      },
    });
  }

  nomeCategoria(id: number | null): string | null {
    return id ? (this.categoriasPorId().get(id) ?? null) : null;
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
