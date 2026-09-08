import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { BdAlertComponent, BdButtonComponent, BdPageHeaderComponent } from 'bandeira-ui';
import { LucideCloudUpload } from '@lucide/angular';

import { CategoriaGastoService } from '../../core/catalog/categoria-gasto.service';
import { CategoriaRendaService } from '../../core/catalog/categoria-renda.service';
import { FormImportacaoComponent } from './form-importacao/form-importacao.component';
import { ImportacaoService } from './data/importacao.service';
import type { EstadoInicialImportacao } from './data/importacao.model';

@Component({
  selector: 'app-importacao',
  standalone: true,
  imports: [
    BdAlertComponent,
    BdButtonComponent,
    BdPageHeaderComponent,
    FormImportacaoComponent,
    LucideCloudUpload,
  ],
  templateUrl: './importacao.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportacaoComponent implements OnInit {
  private readonly importacaoService = inject(ImportacaoService);
  private readonly categoriaGastoService = inject(CategoriaGastoService);
  private readonly categoriaRendaService = inject(CategoriaRendaService);

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly nomeArquivoSelecionado = signal<string | null>(null);
  protected readonly arquivo = signal<File | null>(null);

  /**
   * `null` enquanto o usuário ainda está escolhendo/enviando o arquivo. Assim que o
   * `preVisualizar` inicial responde, guarda o estado que o `FormImportacaoComponent` precisa
   * pra abrir direto na revisão ou pedir o mapeamento de colunas — ver `EstadoInicialImportacao`.
   */
  protected readonly estadoInicial = signal<EstadoInicialImportacao | null>(null);

  ngOnInit(): void {
    forkJoin([
      this.categoriaGastoService.listar(),
      this.categoriaRendaService.listar(),
    ]).subscribe();
  }

  selecionarArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;

    this.arquivo.set(arquivo);
    this.nomeArquivoSelecionado.set(arquivo?.name ?? null);
    this.erro.set(null);
  }

  enviarArquivo(): void {
    const arquivo = this.arquivo();
    if (!arquivo || this.enviando()) return;

    this.enviando.set(true);
    this.erro.set(null);

    this.importacaoService.preVisualizar(arquivo).subscribe({
      next: (resposta) => {
        this.enviando.set(false);

        if (resposta.precisa_mapear) {
          this.estadoInicial.set({ tipo: 'mapear', cabecalho: resposta.cabecalho });

          return;
        }

        this.estadoInicial.set({
          tipo: 'revisar',
          linhas: resposta.data.map((linha) => ({
            ...linha,
            tipo: linha.tipo_sugerido,
            categoriaId: linha.categoria_sugerida_id,
          })),
        });
      },
      error: () => {
        this.enviando.set(false);
        this.erro.set('Não foi possível ler o arquivo. Confirme que é um CSV válido.');
      },
    });
  }

  /** Volta pra tela de escolher/enviar arquivo — chamado pelo `FormImportacaoComponent`. */
  protected reiniciar(): void {
    this.arquivo.set(null);
    this.nomeArquivoSelecionado.set(null);
    this.estadoInicial.set(null);
    this.erro.set(null);
  }
}
