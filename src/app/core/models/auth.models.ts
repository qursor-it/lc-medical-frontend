export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}
