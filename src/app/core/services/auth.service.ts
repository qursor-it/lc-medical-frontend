import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AuthResponse, AuthUser, LoginRequest, PermissionSection } from '../models/auth.models';
import { environment } from '../../../environments/environment';

interface AuthSession extends AuthResponse {}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'lc-medical-auth';
  private readonly session = signal<AuthSession | null>(this.readSession());

  readonly currentUser = computed(() => this.validSession()?.user ?? null);
  readonly isAuthenticated = computed(() => this.validSession() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  /** Whether the current user can view the list of the given section. Admins can always. */
  canView(section: PermissionSection): boolean {
    if (this.isAdmin()) {
      return true;
    }
    const permissions = this.currentUser()?.permissions;
    if (!permissions) {
      return false;
    }
    switch (section) {
      case 'orders':
        return permissions.canViewOrders;
      case 'invoices':
        return permissions.canViewInvoices;
      case 'payments':
        return permissions.canViewPayments;
    }
  }

  /** Whether the current user can upload files for the given section. Admins can always. */
  canUpload(section: PermissionSection): boolean {
    if (this.isAdmin()) {
      return true;
    }
    const permissions = this.currentUser()?.permissions;
    if (!permissions) {
      return false;
    }
    switch (section) {
      case 'orders':
        return permissions.canUploadOrders;
      case 'invoices':
        return permissions.canUploadInvoices;
      case 'payments':
        return permissions.canUploadPayments;
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, request).pipe(
      tap((response) => {
        this.session.set(response);
        localStorage.setItem(this.storageKey, JSON.stringify(response));
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseUrl}/auth/password`, {
      currentPassword,
      newPassword,
    });
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.session.set(null);
  }

  token(): string | null {
    const session = this.validSession();
    if (!session) {
      this.logout();
      return null;
    }

    return session.token;
  }

  private validSession(): AuthSession | null {
    const session = this.session();
    if (!session || Date.parse(session.expiresAt) <= Date.now()) {
      return null;
    }

    return session;
  }

  private readSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
