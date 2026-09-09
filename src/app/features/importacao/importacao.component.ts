import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { LucideUploadCloud } from '@lucide/angular';

import { BarraVoltarComponent } from '../../components/barra-voltar/barra-voltar.component';
import { TituloPaginaComponent } from '../../components/titulo-pagina/titulo-pagina.component';
import { CategoriaGastoService } from '../../core/catalog/categoria-gasto.service';
import { CategoriaRendaService } from '../../core/catalog/categoria-renda.service';
import { FormImportacaoComponent } from './form-importacao/form-importacao.component';
import { ImportacaoService } from './data/importacao.service';
import { UploadExtratoComponent } from './upload-extrato/upload-extrato.component';
import type { EstadoEnvio, EstadoInicialImportacao } from './data/importacao.model';

@Component({
  selector: 'app-importacao',
  standalone: true,
  imports: [
    LucideUploadCloud,
    BarraVoltarComponent,
    TituloPaginaComponent,
    FormImportacaoComponent,
    UploadExtratoComponent,
  ],
  templateUrl: './importacao.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportacaoComponent implements OnInit, OnDestroy {
  private readonly importacaoService = inject(ImportacaoService);
  private readonly categoriaGastoService = inject(CategoriaGastoService);
  private readonly categoriaRendaService = inject(CategoriaRendaService);

  /** Primeira tela do projeto com um observable de várias emissões (chunk a chunk). */
  private readonly destruido$ = new Subject<void>();

  protected readonly estadoEnvio = signal<EstadoEnvio>('ocioso');
  protected readonly percentual = signal(0);
  protected readonly erro = signal<string | null>(null);

  protected readonly nomeArquivoSelecionado = signal<string | null>(null);
  protected readonly arquivo = signal<File | null>(null);

  protected readonly estadoInicial = signal<EstadoInicialImportacao | null>(null);

  ngOnInit(): void {
    forkJoin([
      this.categoriaGastoService.listar(),
      this.categoriaRendaService.listar(),
    ]).subscribe();
  }

  ngOnDestroy(): void {
    this.destruido$.next();
    this.destruido$.complete();
  }

  /** Chamado assim que o usuário escolhe ou solta um arquivo — já dispara o envio sozinho. */
  protected selecionarArquivo(arquivo: File): void {
    this.arquivo.set(arquivo);
    this.nomeArquivoSelecionado.set(arquivo.name);
    this.erro.set(null);
    this.enviarArquivo();
  }

  protected onArrastandoChange(arrastando: boolean): void {
    // Não pisa em cima de um envio já em andamento (ex.: arrastar de novo em cima da barra).
    if (this.estadoEnvio() === 'ocioso' || this.estadoEnvio() === 'arrastando') {
      this.estadoEnvio.set(arrastando ? 'arrastando' : 'ocioso');
    }
  }

  private enviarArquivo(): void {
    const arquivo = this.arquivo();
    if (!arquivo) return;

    this.estadoEnvio.set('enviando');
    this.percentual.set(0);
    this.erro.set(null);

    this.importacaoService
      .enviarPorChunks(arquivo)
      .pipe(takeUntil(this.destruido$))
      .subscribe({
        next: (evento) => {
          if (evento.tipo === 'progresso') {
            this.percentual.set(evento.percentual);

            if (evento.percentual === 100) {
              this.estadoEnvio.set('processando');
            }

            return;
          }

          const resposta = evento.resposta;

          this.estadoInicial.set(
            resposta.precisa_mapear
              ? { tipo: 'mapear', cabecalho: resposta.cabecalho }
              : {
                  tipo: 'revisar',
                  linhas: resposta.data.map((linha) => ({
                    ...linha,
                    tipo: linha.tipo_sugerido,
                    categoriaId: linha.categoria_sugerida_id,
                  })),
                },
          );
        },
        error: () => {
          this.estadoEnvio.set('erro');
          this.erro.set('Não foi possível ler o arquivo. Confirme que é um CSV válido.');
        },
      });
  }

  /** Volta pra tela de escolher/enviar arquivo — chamado pelo `FormImportacaoComponent`. */
  protected reiniciar(): void {
    this.arquivo.set(null);
    this.nomeArquivoSelecionado.set(null);
    this.estadoInicial.set(null);
    this.estadoEnvio.set('ocioso');
    this.percentual.set(0);
    this.erro.set(null);
  }
}
