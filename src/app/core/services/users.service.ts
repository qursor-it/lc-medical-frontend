import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AuthUser,
  CreateUserRequest,
  UpdateUserPermissionsRequest,
  UpdateUserRoleRequest,
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  getUsers(): Observable<AuthUser[]> {
    return this.http.get<AuthUser[]>('/api/users');
  }

  createUser(request: CreateUserRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>('/api/users', request);
  }

  updateRole(id: number, request: UpdateUserRoleRequest): Observable<AuthUser> {
    return this.http.put<AuthUser>(`/api/users/${id}/role`, request);
  }

  updatePermissions(id: number, request: UpdateUserPermissionsRequest): Observable<AuthUser> {
    return this.http.put<AuthUser>(`/api/users/${id}/permissions`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }
}
