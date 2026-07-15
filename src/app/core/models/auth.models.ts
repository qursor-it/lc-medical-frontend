export type UserRole = 'ADMIN' | 'USER';

/** The three gated areas of the app. */
export type PermissionSection = 'orders' | 'invoices' | 'payments';

export interface UserPermissions {
  canUploadOrders: boolean;
  canViewOrders: boolean;
  canUploadInvoices: boolean;
  canViewInvoices: boolean;
  canUploadPayments: boolean;
  canViewPayments: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  permissions: UserPermissions;
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

export type UpdateUserPermissionsRequest = UserPermissions;
