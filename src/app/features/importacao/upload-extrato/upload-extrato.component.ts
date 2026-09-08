import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';
import { BdAlertComponent, BdButtonComponent } from 'bandeira-ui';
import { LucideCloudUpload, LucideRefreshCw } from '@lucide/angular';

import type { EstadoEnvio } from '../data/importacao.model';

@Component({
  selector: 'app-upload-extrato',
  standalone: true,
  imports: [BdAlertComponent, BdButtonComponent, LucideCloudUpload, LucideRefreshCw],
  template: `
    <div class="mx-auto w-full max-w-2xl">
      @if (erro()) {
        <div class="mb-4">
          <bd-alert tone="danger">{{ erro() }}</bd-alert>
        </div>
      }

      <div
        class="app-card flex flex-col items-center gap-4 p-6 py-10 text-center transition-colors"
        [class.border-primary]="estado() === 'arrastando'"
        [class.bg-primary-soft]="estado() === 'arrastando'"
      >
        @switch (estado()) {
          @case ('enviando') {
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft">
              <svg lucideCloudUpload size="26" class="text-primary"></svg>
            </span>
            <div class="w-full">
              <p class="text-sm font-bold text-fg">{{ nomeArquivo() }}</p>
              <p class="mt-1 text-xs text-fg-muted">Enviando... {{ percentual() }}%</p>
              <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                <span
                  class="block h-full rounded-full bg-primary transition-all"
                  [style.width.%]="percentual()"
                ></span>
              </div>
            </div>
          }
          @case ('processando') {
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft">
              <svg lucideCloudUpload size="26" class="animate-pulse text-primary"></svg>
            </span>
            <div>
              <p class="text-sm font-bold text-fg">{{ nomeArquivo() }}</p>
              <p class="mt-1 text-xs text-fg-muted">Lendo e classificando as transações...</p>
            </div>
          }
          @case ('erro') {
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bd-danger-soft)]">
              <svg lucideRefreshCw size="26" class="text-[var(--bd-danger)]"></svg>
            </span>
            <div>
              <p class="text-sm font-bold text-fg">Não consegui ler esse arquivo</p>
              <p class="mt-1 text-xs text-fg-muted">
                Confirme que é um CSV válido e tente de novo.
              </p>
            </div>
            <button bdButton variant="subtle" type="button" class="w-full" (click)="abrirSeletor()">
              Tentar de novo
            </button>
          }
          @default {
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft">
              <svg lucideCloudUpload size="26" class="text-primary"></svg>
            </span>
            <div>
              <p class="text-sm font-bold text-fg">
                {{
                  estado() === 'arrastando'
                    ? 'Pode soltar aqui'
                    : 'Solte ou escolha o arquivo do seu banco'
                }}
              </p>
              <p class="mt-1 text-xs text-fg-muted">O mesmo CSV que você já baixa do seu banco</p>
            </div>
            <button bdButton variant="subtle" type="button" class="w-full" (click)="abrirSeletor()">
              Escolher arquivo
            </button>
          }
        }

        <input
          #inputArquivo
          type="file"
          accept=".csv,.txt"
          class="hidden"
          (change)="onInputChange($event)"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadExtratoComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly estado = input.required<EstadoEnvio>();
  readonly percentual = input(0);
  readonly nomeArquivo = input<string | null>(null);
  readonly erro = input<string | null>(null);

  readonly arquivoSelecionado = output<File>();
  readonly arrastandoChange = output<boolean>();

  protected abrirSeletor(): void {
    const input = this.host.nativeElement.querySelector(
      'input[type=file]',
    ) as HTMLInputElement | null;
    input?.click();
  }

  protected onInputChange(event: Event): void {
    const arquivo = (event.target as HTMLInputElement).files?.[0];

    if (arquivo) this.arquivoSelecionado.emit(arquivo);
  }

  @HostListener('dragover', ['$event'])
  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.arrastandoChange.emit(true);
  }

  @HostListener('dragleave', ['$event'])
  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.arrastandoChange.emit(false);
  }

  @HostListener('drop', ['$event'])
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.arrastandoChange.emit(false);

    const arquivo = event.dataTransfer?.files?.[0];

    if (arquivo) this.arquivoSelecionado.emit(arquivo);
  }
}
