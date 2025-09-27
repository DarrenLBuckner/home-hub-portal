// src/lib/auth/adminPermissions.ts
export interface AdminPermissions {
  canViewUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewPayments: boolean;
  canProcessPayments: boolean;
  canAcceptPayments: boolean;
  canIssueRefunds: boolean;
  canApproveProperties: boolean;
  canRejectProperties: boolean;
  canEscalateToHigherAdmin: boolean;
  canViewSystemSettings: boolean;
  canEditSystemSettings: boolean;
  canViewAllDashboards: boolean;
  canManageAdmins: boolean;
  // Country-based access control
  assignedCountryId: number | null;
  assignedCountryName: string | null;
  canViewAllCountries: boolean;
  countryFilter: number | null;
}

export function getAdminPermissions(
  userType: string, 
  email: string, 
  adminLevel?: string | null,
  countryId?: number | null, 
  countryName?: string | null
): AdminPermissions {
  // Super Admin (mrdarrenbuckner@gmail.com) - Full access to everything, all countries
  if (email === 'mrdarrenbuckner@gmail.com' || adminLevel === 'super') {
    return {
      canViewUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canViewPayments: true,
      canProcessPayments: true,
      canAcceptPayments: true,
      canIssueRefunds: true,
      canApproveProperties: true,
      canRejectProperties: true,
      canEscalateToHigherAdmin: false, // Super admin doesn't need escalation
      canViewSystemSettings: true,
      canEditSystemSettings: true,
      canViewAllDashboards: true,
      canManageAdmins: true,
      assignedCountryId: null, // Super admin not restricted by country
      assignedCountryName: null,
      canViewAllCountries: true,
      countryFilter: null,
    };
  }

  // Country Admin (owner) - Can manage their country, approve/reject, accept payments but not issue refunds
  if (adminLevel === 'owner') {
    return {
      canViewUsers: true,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewPayments: true,
      canProcessPayments: true,
      canAcceptPayments: true,
      canIssueRefunds: false, // Only super admin can issue refunds
      canApproveProperties: true,
      canRejectProperties: true,
      canEscalateToHigherAdmin: true, // Can escalate to super admin
      canViewSystemSettings: true,
      canEditSystemSettings: false,
      canViewAllDashboards: true,
      canManageAdmins: false,
      assignedCountryId: countryId || null,
      assignedCountryName: countryName || null,
      canViewAllCountries: false,
      countryFilter: countryId || null,
    };
  }

  // Basic Admin - First line admin, can approve/reject properties and accept payments
  if (adminLevel === 'basic') {
    return {
      canViewUsers: true,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewPayments: true,
      canProcessPayments: true,
      canAcceptPayments: true,
      canIssueRefunds: false, // Cannot issue refunds
      canApproveProperties: true, // Can approve properties
      canRejectProperties: true, // Can reject properties
      canEscalateToHigherAdmin: true, // Can escalate to owner/super admin
      canViewSystemSettings: false,
      canEditSystemSettings: false,
      canViewAllDashboards: false,
      canManageAdmins: false,
      assignedCountryId: countryId || null,
      assignedCountryName: countryName || null,
      canViewAllCountries: false,
      countryFilter: countryId || null,
    };
  }

  // No admin access (FSBO owners have user_type === 'owner' but NO admin_level)
  return {
    canViewUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewPayments: false,
    canProcessPayments: false,
    canAcceptPayments: false,
    canIssueRefunds: false,
    canApproveProperties: false,
    canRejectProperties: false,
    canEscalateToHigherAdmin: false,
    canViewSystemSettings: false,
    canEditSystemSettings: false,
    canViewAllDashboards: false,
    canManageAdmins: false,
    assignedCountryId: null,
    assignedCountryName: null,
    canViewAllCountries: false,
    countryFilter: null,
  };
}

export function isSuperAdmin(adminLevel: string | null, email: string): boolean {
  return email === 'mrdarrenbuckner@gmail.com' || adminLevel === 'super';
}

// Helper function to get admin permissions with country context from Supabase
export async function getCountryAwareAdminPermissions(
  userType: string,
  email: string,
  adminLevel: string | null,
  userId: string,
  supabase: any
): Promise<AdminPermissions> {
  try {
    // Get user's country assignment from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        country_id,
        countries:country_id (
          id,
          name,
          code
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user country:', error);
      // Fallback to basic permissions without country context
      return getAdminPermissions(userType, email, adminLevel);
    }

    const countryId = profile?.country_id;
    const countryName = profile?.countries?.name;

    return getAdminPermissions(userType, email, adminLevel, countryId, countryName);
  } catch (error) {
    console.error('Error in getCountryAwareAdminPermissions:', error);
    // Fallback to basic permissions
    return getAdminPermissions(userType, email, adminLevel);
  }
}

// Helper function to check if user can access data from a specific country
export function canAccessCountryData(permissions: AdminPermissions, targetCountryId: number): boolean {
  // Super admin can access all countries
  if (permissions.canViewAllCountries) {
    return true;
  }

  // Country-specific admin can only access their assigned country
  return permissions.assignedCountryId === targetCountryId;
}

// Helper function to filter data based on country permissions
export function getCountryFilter(permissions: AdminPermissions): { countryId?: number; all: boolean } {
  if (permissions.canViewAllCountries) {
    return { all: true };
  }

  if (permissions.assignedCountryId) {
    return { countryId: permissions.assignedCountryId, all: false };
  }

  return { all: false }; // No access
}

export function isAdmin(userType: string): boolean {
  return ['admin', 'super_admin', 'owner_admin'].includes(userType);
}