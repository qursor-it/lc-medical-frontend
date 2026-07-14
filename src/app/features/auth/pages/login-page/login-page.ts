import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ButtonModule],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly loading = signal(false);

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl());
    }
  }

  protected updateEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected updatePassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected login(): void {
    if (!this.email().trim() || !this.password()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Credenziali mancanti',
        detail: 'Inserisci email e password.',
      });
      return;
    }

    this.loading.set(true);
    this.auth.login({ email: this.email().trim(), password: this.password() }).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl()),
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Accesso non riuscito',
          detail: this.errorMessage(error),
        });
      },
      complete: () => this.loading.set(false),
    });
  }

  private returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }

    return 'Verifica email e password.';
  }
}
