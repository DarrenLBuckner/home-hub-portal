import { createClient } from '@/supabase';

// Define admin role types
export type AdminRole = 'admin' | 'super_admin';

// Define permission categories
export interface AdminPermissions {
  // User Management
  canViewUsers: boolean;
  canApproveUsers: boolean;
  canRejectUsers: boolean;
  canChangeUserRoles: boolean;
  canDeleteUsers: boolean;
  
  // Property Management
  canViewProperties: boolean;
  canApproveProperties: boolean;
  canRejectProperties: boolean;
  canDeleteProperties: boolean;
  
  // Financial Operations
  canViewFinancials: boolean;
  canViewPaymentHistory: boolean;
  canProcessPayments: boolean;
  canViewRevenue: boolean;
  canExportFinancialData: boolean;
  
  // System Administration
  canChangeSettings: boolean;
  canManageAdmins: boolean;
  canViewSystemLogs: boolean;
  canManageDatabase: boolean;
  canConfigureSecurity: boolean;
  
  // Communication
  canSendNotifications: boolean;
  canSendBulkEmails: boolean;
  canManageEmailTemplates: boolean;
  
  // Analytics & Reports
  canViewAnalytics: boolean;
  canGenerateReports: boolean;
  canExportData: boolean;
}

// Role-based permission mappings
const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  admin: {
    // User Management - Limited
    canViewUsers: true,
    canApproveUsers: true,
    canRejectUsers: true,
    canChangeUserRoles: false, // Only super_admin can change roles
    canDeleteUsers: false,
    
    // Property Management - Full access
    canViewProperties: true,
    canApproveProperties: true,
    canRejectProperties: true,
    canDeleteProperties: false, // Only super_admin can delete
    
    // Financial Operations - Limited
    canViewFinancials: true,
    canViewPaymentHistory: true,
    canProcessPayments: true,
    canViewRevenue: false, // Only super_admin sees revenue
    canExportFinancialData: false,
    
    // System Administration - None
    canChangeSettings: false,
    canManageAdmins: false,
    canViewSystemLogs: false,
    canManageDatabase: false,
    canConfigureSecurity: false,
    
    // Communication - Limited
    canSendNotifications: true,
    canSendBulkEmails: false,
    canManageEmailTemplates: false,
    
    // Analytics & Reports - Limited
    canViewAnalytics: true,
    canGenerateReports: false,
    canExportData: false,
  },
  
  super_admin: {
    // User Management - Full access
    canViewUsers: true,
    canApproveUsers: true,
    canRejectUsers: true,
    canChangeUserRoles: true,
    canDeleteUsers: true,
    
    // Property Management - Full access
    canViewProperties: true,
    canApproveProperties: true,
    canRejectProperties: true,
    canDeleteProperties: true,
    
    // Financial Operations - Full access
    canViewFinancials: true,
    canViewPaymentHistory: true,
    canProcessPayments: true,
    canViewRevenue: true,
    canExportFinancialData: true,
    
    // System Administration - Full access
    canChangeSettings: true,
    canManageAdmins: true,
    canViewSystemLogs: true,
    canManageDatabase: true,
    canConfigureSecurity: true,
    
    // Communication - Full access
    canSendNotifications: true,
    canSendBulkEmails: true,
    canManageEmailTemplates: true,
    
    // Analytics & Reports - Full access
    canViewAnalytics: true,
    canGenerateReports: true,
    canExportData: true,
  }
};

/**
 * Get user's admin role from database
 */
export async function getUserAdminRole(userId: string): Promise<AdminRole | null> {
  try {
    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      return null;
    }
    
    if (profile.user_type === 'admin' || profile.user_type === 'super_admin') {
      return profile.user_type as AdminRole;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user admin role:', error);
    return null;
  }
}

/**
 * Get permissions for a specific admin role
 */
export function getPermissionsForRole(role: AdminRole): AdminPermissions {
  return ROLE_PERMISSIONS[role];
}

/**
 * Get permissions for a specific user
 */
export async function getUserPermissions(userId: string): Promise<AdminPermissions | null> {
  const role = await getUserAdminRole(userId);
  if (!role) {
    return null;
  }
  return getPermissionsForRole(role);
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string, 
  permission: keyof AdminPermissions
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  if (!permissions) {
    return false;
  }
  return permissions[permission];
}

/**
 * Require specific permission - throws error if not authorized
 */
export async function requirePermission(
  userId: string, 
  permission: keyof AdminPermissions
): Promise<void> {
  const hasAccess = await hasPermission(userId, permission);
  if (!hasAccess) {
    throw new Error(`Unauthorized: ${permission} permission required`);
  }
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserAdminRole(userId);
  return role === 'super_admin';
}

/**
 * Require super admin access
 */
export async function requireSuperAdmin(userId: string): Promise<void> {
  const isSuper = await isSuperAdmin(userId);
  if (!isSuper) {
    throw new Error('Unauthorized: Super admin access required');
  }
}

// Convenience functions for common permission checks
export async function canManageUsers(userId: string): Promise<boolean> {
  return hasPermission(userId, 'canChangeUserRoles');
}

export async function canViewFinancials(userId: string): Promise<boolean> {
  return hasPermission(userId, 'canViewFinancials');
}

export async function canChangeSettings(userId: string): Promise<boolean> {
  return hasPermission(userId, 'canChangeSettings');
}

export async function canManageAdmins(userId: string): Promise<boolean> {
  return hasPermission(userId, 'canManageAdmins');
}

export async function canViewRevenue(userId: string): Promise<boolean> {
  return hasPermission(userId, 'canViewRevenue');
}

export async function canExportData(userId: string): Promise<boolean> {
  return hasPermission(userId, 'canExportData');
}

export async function canDeleteUsers(userId: string): Promise<boolean> {
  return hasPermission(userId, 'canDeleteUsers');
}

export async function canDeleteProperties(userId: string): Promise<boolean> {
  return hasPermission(userId, 'canDeleteProperties');
}

// Client-side permission checking (for UI components)
export interface ClientPermissions extends AdminPermissions {
  role: AdminRole;
}

/**
 * Get permissions for client-side use (with role info)
 */
export async function getClientPermissions(userId: string): Promise<ClientPermissions | null> {
  const role = await getUserAdminRole(userId);
  if (!role) {
    return null;
  }
  
  const permissions = getPermissionsForRole(role);
  return {
    ...permissions,
    role
  };
}

/**
 * Permission checker hook for React components
 */
export function createPermissionChecker(permissions: ClientPermissions) {
  return {
    can: (permission: keyof AdminPermissions) => permissions[permission],
    isSuperAdmin: () => permissions.role === 'super_admin',
    isAdmin: () => permissions.role === 'admin',
    role: permissions.role
  };
}