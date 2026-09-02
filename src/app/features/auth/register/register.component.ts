import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BdButtonComponent, BdFieldComponent, BdInputComponent } from 'bandeira-ui';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, BdButtonComponent, BdFieldComponent, BdInputComponent],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected name = '';
  protected email = '';
  protected password = '';
  protected passwordConfirmation = '';
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);

  submit(): void {
    if (this.loading()) return;

    if (this.password !== this.passwordConfirmation) {
      this.erro.set('As senhas não coincidem.');
      return;
    }

    this.erro.set(null);
    this.loading.set(true);

    this.auth.register(this.name, this.email, this.password, this.passwordConfirmation).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: (err) => {
        this.loading.set(false);
        this.erro.set(err.error?.message ?? 'Não foi possível criar a conta.');
      },
    });
  }
}
