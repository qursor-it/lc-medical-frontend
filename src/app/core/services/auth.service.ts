import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AuthResponse, AuthUser, LoginRequest } from '../models/auth.models';

interface AuthSession extends AuthResponse {}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'lc-medical-auth';
  private readonly session = signal<AuthSession | null>(this.readSession());

  readonly currentUser = computed(() => this.validSession()?.user ?? null);
  readonly isAuthenticated = computed(() => this.validSession() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap((response) => {
        this.session.set(response);
        localStorage.setItem(this.storageKey, JSON.stringify(response));
      }),
    );
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
