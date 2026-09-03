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

import { ObrigacaoFixaService } from './data/obrigacao-fixa.service';
import type { ObrigacaoFixa, ObrigacaoFixaPayload } from './data/obrigacao-fixa.model';

const FORM_VAZIO: ObrigacaoFixaPayload = {
  descricao: '',
  valor: 0,
  dia_vencimento: 1,
  ativa: true,
};

@Component({
  selector: 'app-obrigacoes',
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
  templateUrl: './obrigacoes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObrigacoesComponent implements OnInit {
  private readonly obrigacaoService = inject(ObrigacaoFixaService);

  protected readonly obrigacoes = this.obrigacaoService.obrigacoes;
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly editandoId = signal<number | null>(null);
  protected form: ObrigacaoFixaPayload = { ...FORM_VAZIO };

  ngOnInit(): void {
    this.obrigacaoService.listar().subscribe({
      next: () => this.carregando.set(false),
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar suas obrigações fixas.');
      },
    });
  }

  editar(obrigacao: ObrigacaoFixa): void {
    this.editandoId.set(obrigacao.id);
    this.form = {
      descricao: obrigacao.descricao,
      valor: Number(obrigacao.valor),
      dia_vencimento: obrigacao.dia_vencimento,
      ativa: obrigacao.ativa,
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
      ? this.obrigacaoService.atualizar(id, this.form)
      : this.obrigacaoService.criar(this.form);

    requisicao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.cancelarEdicao();
      },
      error: () => {
        this.salvando.set(false);
        this.erro.set('Não foi possível salvar essa obrigação fixa.');
      },
    });
  }

  excluir(obrigacao: ObrigacaoFixa): void {
    if (!confirm(`Excluir "${obrigacao.descricao}"?`)) return;

    this.obrigacaoService.excluir(obrigacao.id).subscribe({
      error: () => this.erro.set('Não foi possível excluir essa obrigação fixa.'),
    });
  }
}
