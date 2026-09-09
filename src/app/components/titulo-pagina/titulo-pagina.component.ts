import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Cabeçalho de página: ícone da seção + título + subtítulo — substitui o
 * `bd-page-header` da lib nas telas do app (que não tem espaço pra ícone).
 * O ícone é projetado (mesmo ícone usado no menu, ver `shell-nav.config.ts`),
 * pra reforçar visualmente em que seção o usuário está.
 *
 * O título sai como `<h1>` — mesma regra do `bd-page-header`: pular esse
 * nível quebra a navegação por cabeçalhos no leitor de tela.
 *
 * Sem slot de ação — o botão de ação de cada tela (ex. "Novo gasto") mora na
 * [[BarraVoltarComponent|app-barra-voltar]], não aqui: é a barra que tem o
 * conceito de "linha do Voltar com uma ação opcional na ponta".
 *
 * @example
 * ```html
 * <app-titulo-pagina titulo="Rendas" subtitulo="Seus lançamentos de renda.">
 *   <svg appTituloPaginaIcone lucideBanknote></svg>
 * </app-titulo-pagina>
 * ```
 */
@Component({
  selector: 'app-titulo-pagina',
  standalone: true,
  template: `
    <div class="flex items-center gap-3.5">
      <span
        class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"
      >
        <ng-content select="[appTituloPaginaIcone]" />
      </span>
      <div>
        <h1 class="text-xl font-bold tracking-tight text-fg">{{ titulo() }}</h1>
        @if (subtitulo()) {
          <p class="mt-0.5 text-sm text-fg-muted">{{ subtitulo() }}</p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TituloPaginaComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
}
