import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BdButtonComponent, BdFieldComponent, BdInputComponent } from 'bandeira-ui';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, BdButtonComponent, BdFieldComponent, BdInputComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);

  submit(): void {
    if (this.loading()) return;
    this.erro.set(null);
    this.loading.set(true);

    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (err) => {
        this.loading.set(false);
        this.erro.set(
          err.status === 404
            ? 'E-mail não encontrado.'
            : err.status === 401
              ? 'Senha incorreta.'
              : 'Não foi possível entrar. Tente de novo.'
        );
      },
    });
  }
}
