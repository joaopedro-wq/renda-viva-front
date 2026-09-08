import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { iconeCategoria } from './categoria-icones';


@Component({
  selector: 'app-categoria-icon',
  standalone: true,
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex shrink-0 items-center justify-center rounded-full"
      [class.h-10]="size() === 'md'"
      [class.w-10]="size() === 'md'"
      [class.h-8]="size() === 'sm'"
      [class.w-8]="size() === 'sm'"
      [style.background-color]="fundo()"
      [style.color]="cor()"
    >
      <ng-container
        *ngComponentOutlet="icone(); inputs: { size: size() === 'md' ? 20 : 16 }"
      />
    </span>
  `,
})
export class CategoriaIconComponent {
  readonly cor = input<string>('#8a8a8a');
  readonly nomeIcone = input<string | null>(null, { alias: 'icone' });
  readonly size = input<'sm' | 'md'>('md');

  protected readonly icone = computed(() => iconeCategoria(this.nomeIcone()));
  protected readonly fundo = computed(() => `color-mix(in srgb, ${this.cor()} 16%, transparent)`);
}
