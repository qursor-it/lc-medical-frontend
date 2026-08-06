import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';

import { AuthUser, UserPermissions, UserRole } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';
import { UsersService } from '../../../../core/services/users.service';

const EMPTY_PERMISSIONS: UserPermissions = {
  canUploadOrders: false,
  canViewOrders: false,
  canUploadInvoices: false,
  canViewInvoices: false,
  canUploadPayments: false,
  canViewPayments: false,
};

@Component({
  selector: 'app-users-page',
  imports: [
    ButtonModule,
    DialogModule,
    FormsModule,
    SelectModule,
    TableModule,
    TagModule,
    ToggleSwitchModule,
  ],
  templateUrl: './users-page.html',
})
export class UsersPage implements OnInit {
  private readonly usersService = inject(UsersService);
  protected readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);

  protected readonly users = signal<AuthUser[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly createVisible = signal(false);
  protected readonly email = signal('');
  protected readonly fullName = signal('');
  protected readonly password = signal('');
  protected readonly role = signal<UserRole>('USER');

  protected readonly roleOptions = [
    { label: 'Utente', value: 'USER' as UserRole },
    { label: 'Admin', value: 'ADMIN' as UserRole },
  ];

  protected readonly permissionsUser = signal<AuthUser | null>(null);
  protected readonly permissionsDraft = signal<UserPermissions>({ ...EMPTY_PERMISSIONS });
  protected readonly permissionsSaving = signal(false);

  protected readonly resetPasswordUser = signal<AuthUser | null>(null);
  protected readonly resetPasswordValue = signal('');
  protected readonly resetPasswordConfirm = signal('');
  protected readonly resetPasswordSaving = signal(false);

  protected readonly permissionSections: {
    label: string;
    icon: string;
    view: keyof UserPermissions;
    upload: keyof UserPermissions;
  }[] = [
    { label: 'Ordini', icon: 'pi pi-list', view: 'canViewOrders', upload: 'canUploadOrders' },
    {
      label: 'Pagamenti',
      icon: 'pi pi-credit-card',
      view: 'canViewPayments',
      upload: 'canUploadPayments',
    },
  ];

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

  protected openCreate(): void {
    this.email.set('');
    this.fullName.set('');
    this.password.set('');
    this.role.set('USER');
    this.createVisible.set(true);
  }

  protected closeCreate(): void {
    this.createVisible.set(false);
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
          this.closeCreate();
          this.messages.add({ severity: 'success', summary: 'Utente creato' });
        },
        error: (error: HttpErrorResponse) => this.showError('Utente non creato', error),
      });
  }

  protected changeRole(user: AuthUser, role: UserRole): void {
    if (role === user.role) {
      return;
    }
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

  protected permissionSummary(user: AuthUser): string {
    const permissions = user.permissions;
    if (!permissions) {
      return 'Nessun accesso';
    }
    const sections: string[] = [];
    if (permissions.canViewOrders || permissions.canUploadOrders) {
      sections.push('Ordini');
    }
    if (permissions.canViewPayments || permissions.canUploadPayments) {
      sections.push('Pagamenti');
    }
    return sections.length ? sections.join(' · ') : 'Nessun accesso';
  }

  protected openPermissions(user: AuthUser): void {
    this.permissionsUser.set(user);
    this.permissionsDraft.set({ ...EMPTY_PERMISSIONS, ...user.permissions });
  }

  protected closePermissions(): void {
    this.permissionsUser.set(null);
  }

  protected permissionValue(key: keyof UserPermissions): boolean {
    return this.permissionsDraft()[key];
  }

  protected setPermission(key: keyof UserPermissions, value: boolean): void {
    this.permissionsDraft.update((draft) => ({ ...draft, [key]: value }));
  }

  protected grantedCount(): number {
    return Object.values(this.permissionsDraft()).filter(Boolean).length;
  }

  protected grantAll(): void {
    this.permissionsDraft.set({
      canUploadOrders: true,
      canViewOrders: true,
      canUploadInvoices: true,
      canViewInvoices: true,
      canUploadPayments: true,
      canViewPayments: true,
    });
  }

  protected revokeAll(): void {
    this.permissionsDraft.set({ ...EMPTY_PERMISSIONS });
  }

  protected savePermissions(): void {
    const user = this.permissionsUser();
    if (!user) {
      return;
    }

    this.permissionsSaving.set(true);
    this.usersService
      .updatePermissions(user.id, this.permissionsDraft())
      .pipe(finalize(() => this.permissionsSaving.set(false)))
      .subscribe({
        next: (updated) => {
          this.users.update((users) =>
            users.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.closePermissions();
          this.messages.add({ severity: 'success', summary: 'Permessi aggiornati' });
        },
        error: (error: HttpErrorResponse) => this.showError('Permessi non aggiornati', error),
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

  protected openResetPassword(user: AuthUser): void {
    this.resetPasswordUser.set(user);
    this.resetPasswordValue.set('');
    this.resetPasswordConfirm.set('');
  }

  protected closeResetPassword(): void {
    this.resetPasswordUser.set(null);
  }

  protected updateResetPasswordValue(event: Event): void {
    this.resetPasswordValue.set((event.target as HTMLInputElement).value);
  }

  protected updateResetPasswordConfirm(event: Event): void {
    this.resetPasswordConfirm.set((event.target as HTMLInputElement).value);
  }

  protected submitResetPassword(): void {
    const user = this.resetPasswordUser();
    if (!user) {
      return;
    }
    if (this.resetPasswordValue().length < 8) {
      this.messages.add({
        severity: 'warn',
        summary: 'Password troppo corta',
        detail: 'La nuova password deve avere almeno 8 caratteri.',
      });
      return;
    }
    if (this.resetPasswordValue() !== this.resetPasswordConfirm()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Le password non coincidono',
        detail: 'La conferma non corrisponde alla nuova password.',
      });
      return;
    }

    this.resetPasswordSaving.set(true);
    this.usersService
      .resetPassword(user.id, this.resetPasswordValue())
      .pipe(finalize(() => this.resetPasswordSaving.set(false)))
      .subscribe({
        next: () => {
          this.closeResetPassword();
          this.messages.add({ severity: 'success', summary: 'Password reimpostata' });
        },
        error: (error: HttpErrorResponse) => this.showError('Password non reimpostata', error),
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

  protected inputClass(): string {
    return 'mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
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
