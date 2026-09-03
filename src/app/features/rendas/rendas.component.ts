import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BdAlertComponent,
  BdButtonComponent,
  BdCardComponent,
  BdCheckboxComponent,
  BdEmptyStateComponent,
  BdFieldComponent,
  BdInputComponent,
  BdPageHeaderComponent,
} from 'bandeira-ui';

import { RendaService } from './data/renda.service';
import type { Renda, RendaPayload } from './data/renda.model';

const FORM_VAZIO: RendaPayload = {
  descricao: '',
  fonte: '',
  valor: 0,
  data_recebimento: '',
  recorrente: false,
};

@Component({
  selector: 'app-rendas',
  standalone: true,
  imports: [
    FormsModule,
    BdAlertComponent,
    BdButtonComponent,
    BdCardComponent,
    BdCheckboxComponent,
    BdEmptyStateComponent,
    BdFieldComponent,
    BdInputComponent,
    BdPageHeaderComponent,
  ],
  templateUrl: './rendas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RendasComponent implements OnInit {
  private readonly rendaService = inject(RendaService);

  protected readonly rendas = this.rendaService.rendas;
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  /** `null` = criando; id != null = editando essa renda. */
  protected readonly editandoId = signal<number | null>(null);
  protected form: RendaPayload = { ...FORM_VAZIO };

  ngOnInit(): void {
    this.rendaService.listar().subscribe({
      next: () => this.carregando.set(false),
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar suas rendas.');
      },
    });
  }

  editar(renda: Renda): void {
    this.editandoId.set(renda.id);
    this.form = {
      descricao: renda.descricao,
      fonte: renda.fonte,
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
