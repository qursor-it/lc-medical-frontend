import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

import { AuthUser, UserRole } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';
import { UsersService } from '../../../../core/services/users.service';

@Component({
  selector: 'app-users-page',
  imports: [ButtonModule, TableModule, TagModule],
  templateUrl: './users-page.html',
})
export class UsersPage implements OnInit {
  private readonly usersService = inject(UsersService);
  protected readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);

  protected readonly users = signal<AuthUser[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly email = signal('');
  protected readonly fullName = signal('');
  protected readonly password = signal('');
  protected readonly role = signal<UserRole>('USER');

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.usersService
      .getUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => this.users.set(users),
        error: (error: HttpErrorResponse) => this.showError('Utenti non caricati', error),
      });
  }

  protected createUser(): void {
    if (!this.email().trim() || !this.fullName().trim() || this.password().length < 8) {
      this.messages.add({
        severity: 'warn',
        summary: 'Dati incompleti',
        detail: 'Email, nome e password di almeno 8 caratteri sono obbligatori.',
      });
      return;
    }

    this.saving.set(true);
    this.usersService
      .createUser({
        email: this.email().trim(),
        fullName: this.fullName().trim(),
        password: this.password(),
        role: this.role(),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (user) => {
          this.users.update((users) =>
            [...users, user].sort((a, b) => a.email.localeCompare(b.email)),
          );
          this.email.set('');
          this.fullName.set('');
          this.password.set('');
          this.role.set('USER');
          this.messages.add({ severity: 'success', summary: 'Utente creato' });
        },
        error: (error: HttpErrorResponse) => this.showError('Utente non creato', error),
      });
  }

  protected changeRole(user: AuthUser, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as UserRole;
    this.usersService.updateRole(user.id, { role }).subscribe({
      next: (updated) =>
        this.users.update((users) =>
          users.map((item) => (item.id === updated.id ? updated : item)),
        ),
      error: (error: HttpErrorResponse) => {
        this.showError('Ruolo non aggiornato', error);
        this.loadUsers();
      },
    });
  }

  protected deleteUser(user: AuthUser): void {
    if (user.id === this.auth.currentUser()?.id) {
      this.messages.add({
        severity: 'warn',
        summary: 'Operazione non consentita',
        detail: 'Non puoi eliminare il tuo utente dalla sessione corrente.',
      });
      return;
    }

    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update((users) => users.filter((item) => item.id !== user.id));
        this.messages.add({ severity: 'success', summary: 'Utente eliminato' });
      },
      error: (error: HttpErrorResponse) => this.showError('Utente non eliminato', error),
    });
  }

  protected updateEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected updateFullName(event: Event): void {
    this.fullName.set((event.target as HTMLInputElement).value);
  }

  protected updatePassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected updateRole(event: Event): void {
    this.role.set((event.target as HTMLSelectElement).value as UserRole);
  }

  protected roleLabel(role: UserRole): string {
    return role === 'ADMIN' ? 'Admin' : 'Utente';
  }

  private showError(summary: string, error: HttpErrorResponse): void {
    this.messages.add({
      severity: 'error',
      summary,
      detail:
        typeof error.error?.error === 'string' ? error.error.error : 'Operazione non riuscita.',
    });
  }
}
