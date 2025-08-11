// src/lib/auth/permissions.ts
export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  BUYER = 'buyer',
  SELLER = 'seller'
}

export enum Permission {
  CREATE_PROPERTY = 'create:property',
  READ_PROPERTY = 'read:property',
  UPDATE_PROPERTY = 'update:property',
  DELETE_PROPERTY = 'delete:property',
  MANAGE_USERS = 'manage:users'
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.CREATE_PROPERTY,
    Permission.READ_PROPERTY,
    Permission.UPDATE_PROPERTY,
    Permission.DELETE_PROPERTY,
    Permission.MANAGE_USERS
  ],
  [UserRole.AGENT]: [
    Permission.CREATE_PROPERTY,
    Permission.READ_PROPERTY,
    Permission.UPDATE_PROPERTY
  ],
  [UserRole.SELLER]: [
    Permission.CREATE_PROPERTY,
    Permission.READ_PROPERTY,
    Permission.UPDATE_PROPERTY
  ],
  [UserRole.BUYER]: [
    Permission.READ_PROPERTY
  ]
}

export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  return rolePermissions[userRole]?.includes(permission) || false
}