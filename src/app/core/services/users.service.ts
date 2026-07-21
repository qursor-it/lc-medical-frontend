import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AuthUser,
  CreateUserRequest,
  UpdateUserPermissionsRequest,
  UpdateUserRoleRequest,
} from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  getUsers(): Observable<AuthUser[]> {
    return this.http.get<AuthUser[]>(`${environment.apiBaseUrl}/users`);
  }

  createUser(request: CreateUserRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${environment.apiBaseUrl}/users`, request);
  }

  updateRole(id: number, request: UpdateUserRoleRequest): Observable<AuthUser> {
    return this.http.put<AuthUser>(`${environment.apiBaseUrl}/users/${id}/role`, request);
  }

  updatePermissions(id: number, request: UpdateUserPermissionsRequest): Observable<AuthUser> {
    return this.http.put<AuthUser>(`${environment.apiBaseUrl}/users/${id}/permissions`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/users/${id}`);
  }

  resetPassword(id: number, newPassword: string): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseUrl}/users/${id}/password`, { newPassword });
  }
}
