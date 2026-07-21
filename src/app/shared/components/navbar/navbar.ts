import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [ButtonModule, DialogModule, FormsModule, NgClass, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  host: { class: 'contents' },
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly isMobileNavOpen = signal(false);

  protected readonly changePasswordVisible = signal(false);
  protected readonly currentPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly changePasswordSaving = signal(false);

  protected toggleMobileNav(): void {
    this.isMobileNavOpen.update((open) => !open);
  }

  protected closeMobileNav(): void {
    this.isMobileNavOpen.set(false);
  }

  protected logout(): void {
    this.closeMobileNav();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  protected openChangePassword(): void {
    this.closeMobileNav();
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.changePasswordVisible.set(true);
  }

  protected closeChangePassword(): void {
    this.changePasswordVisible.set(false);
  }

  protected submitChangePassword(): void {
    if (this.newPassword().length < 8) {
      this.messages.add({
        severity: 'warn',
        summary: 'Password troppo corta',
        detail: 'La nuova password deve avere almeno 8 caratteri.',
      });
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Le password non coincidono',
        detail: 'La conferma non corrisponde alla nuova password.',
      });
      return;
    }

    this.changePasswordSaving.set(true);
    this.auth
      .changePassword(this.currentPassword(), this.newPassword())
      .pipe(finalize(() => this.changePasswordSaving.set(false)))
      .subscribe({
        next: () => {
          this.closeChangePassword();
          this.messages.add({ severity: 'success', summary: 'Password aggiornata' });
        },
        error: (error: HttpErrorResponse) => {
          this.messages.add({
            severity: 'error',
            summary: 'Password non aggiornata',
            detail:
              typeof error.error?.error === 'string'
                ? error.error.error
                : 'Operazione non riuscita.',
          });
        },
      });
  }

  protected updateCurrentPassword(event: Event): void {
    this.currentPassword.set((event.target as HTMLInputElement).value);
  }

  protected updateNewPassword(event: Event): void {
    this.newPassword.set((event.target as HTMLInputElement).value);
  }

  protected updateConfirmPassword(event: Event): void {
    this.confirmPassword.set((event.target as HTMLInputElement).value);
  }

  protected inputClass(): string {
    return 'mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
  }

  @HostListener('window:keydown.escape')
  protected handleEscape(): void {
    this.closeMobileNav();
  }
}
