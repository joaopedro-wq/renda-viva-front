import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { LucideChevronLeft } from '@lucide/angular';

@Component({
  selector: 'app-barra-voltar',
  standalone: true,
  imports: [LucideChevronLeft],
  template: `
    <div class="mb-5 flex items-center justify-between gap-4">
      <button
        type="button"
        class="-ml-2 inline-flex items-center gap-1.5 rounded-full py-2 pl-2 pr-3.5 text-sm font-semibold text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
        (click)="voltar()"
      >
        <svg lucideChevronLeft size="16"></svg>
        Voltar
      </button>
      <ng-content select="[appBarraVoltarAcao]" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraVoltarComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly rota = input<string>();

  protected voltar(): void {
    const rota = this.rota();

    if (rota) {
      this.router.navigateByUrl(rota);
      return;
    }

    this.location.back();
  }
}
