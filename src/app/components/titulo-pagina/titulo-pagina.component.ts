import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
