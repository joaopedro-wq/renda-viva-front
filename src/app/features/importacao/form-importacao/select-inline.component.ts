import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideCheck, LucideChevronDown } from '@lucide/angular';

export interface OpcaoSelectInline {
  valor: string | number | null;
  rotulo: string;
  cor?: string;
}

@Component({
  selector: 'app-select-inline',
  standalone: true,
  imports: [LucideCheck, LucideChevronDown],
  template: `
    <button
      #gatilho
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
      [style.background]="corFundo() ?? 'var(--bd-surface-hover)'"
      [style.color]="corTexto() ?? 'var(--bd-fg-muted)'"
      [attr.aria-expanded]="aberto()"
      (click)="alternar(gatilho)"
    >
      <span class="max-w-[9rem] truncate">{{ rotuloAtual() }}</span>
      <svg
        lucideChevronDown
        size="13"
        class="shrink-0 transition-transform"
        [class.rotate-180]="aberto()"
      ></svg>
    </button>

    @if (aberto()) {
      <div
        class="z-[100] max-h-64 min-w-[10rem] overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-md"
        style="position: fixed; transform: translateX(-100%);"
        [style.top.px]="posicao().top"
        [style.left.px]="posicao().left"
      >
        @for (opcao of opcoes(); track opcao.valor) {
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-hover"
            [class.bg-primary-soft]="opcao.valor === valor()"
            [class.text-primary]="opcao.valor === valor()"
            [class.font-semibold]="opcao.valor === valor()"
            (click)="escolher(opcao)"
          >
            @if (opcao.cor) {
              <span class="h-2 w-2 shrink-0 rounded-full" [style.background]="opcao.cor"></span>
            }
            <span class="flex-1 truncate">{{ opcao.rotulo }}</span>
            @if (opcao.valor === valor()) {
              <svg lucideCheck size="14" class="shrink-0"></svg>
            }
          </button>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectInlineComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly opcoes = input.required<OpcaoSelectInline[]>();
  readonly valor = input<string | number | null>(null);
  readonly corFundo = input<string | null>(null);
  readonly corTexto = input<string | null>(null);

  readonly valorChange = output<string | number | null>();

  protected readonly aberto = signal(false);
  protected readonly posicao = signal({ top: 0, left: 0 });

  protected readonly rotuloAtual = computed(
    () => this.opcoes().find((o) => o.valor === this.valor())?.rotulo ?? '',
  );

  protected alternar(botao: HTMLButtonElement): void {
    if (this.aberto()) {
      this.fechar();

      return;
    }

    const rect = botao.getBoundingClientRect();
    this.posicao.set({ top: rect.bottom + 6, left: rect.right });
    this.aberto.set(true);
  }

  protected escolher(opcao: OpcaoSelectInline): void {
    this.valorChange.emit(opcao.valor);
    this.fechar();
  }

  private fechar(): void {
    this.aberto.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected aoClicarFora(event: MouseEvent): void {
    if (this.aberto() && !this.host.nativeElement.contains(event.target as Node)) {
      this.fechar();
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  protected aoRolarOuRedimensionar(): void {
    if (this.aberto()) this.fechar();
  }

  @HostListener('document:keydown.escape')
  protected aoPressionarEsc(): void {
    this.fechar();
  }
}
