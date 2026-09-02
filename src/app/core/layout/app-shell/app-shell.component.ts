import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BdAvatarComponent, BdButtonComponent } from 'bandeira-ui';
import { SHELL_NAVIGATION_CONFIG } from 'bandeira-shell';
import { BsShellComponent } from 'bandeira-shell/ui';
import { LucideLogOut } from '@lucide/angular';

import { AuthService } from '../../auth/auth.service';
import { NAV_ITEMS } from '../../../shell-nav.config';

/**
 * Wrapper fino sobre o motor genérico `bs-shell` (`bandeira-shell/ui`) — só o
 * que é específico do app (marca, saudação, rodapé de perfil) entra via
 * slots. `SHELL_NAVIGATION_CONFIG` fica nos `providers` do próprio
 * `@Component`, não em `app.config.ts`: assim os ícones Lucide dos itens de
 * menu só entram no chunk lazy do shell, não no bundle inicial (mesma lição
 * do vitality-front — ver CLAUDE.md de lá se um dia este projeto ganhar um).
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  providers: [{ provide: SHELL_NAVIGATION_CONFIG, useValue: NAV_ITEMS }],
  imports: [RouterLink, BdAvatarComponent, BdButtonComponent, BsShellComponent, LucideLogOut],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly primeiroNome = computed(
    () => this.auth.currentUser()?.name?.split(' ')[0] ?? ''
  );

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
