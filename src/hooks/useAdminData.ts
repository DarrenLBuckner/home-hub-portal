import { useState, useEffect } from 'react';
import { createClient } from '@/supabase';

interface AdminData {
  id: string;
  email: string;
  user_type: string;
  admin_level: 'super' | 'owner' | 'basic' | null;
  country_id: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  created_by_admin: string | null;
  admin_created_at: string | null;
}

interface AdminPermissions {
  canManageAllUsers: boolean;
  canManageCountryUsers: boolean;
  canCreateOwnerAdmins: boolean;
  canCreateBasicAdmins: boolean;
  canViewAllPayments: boolean;
  canViewCountryPayments: boolean;
  canViewPayments: boolean;
  canRemoveAdmins: boolean;
  canApproveProperties: boolean;
  canRejectProperties: boolean;
  canEscalateToHigherAdmin: boolean;
  canViewAllCountries: boolean;
  countryRestriction: string | null;
  countryFilter: string | null;
  displayRole: string;
}

interface UseAdminDataReturn {
  adminData: AdminData | null;
  permissions: AdminPermissions | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  refreshAdminData: () => Promise<void>;
}

export function useAdminData(): UseAdminDataReturn {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculatePermissions = (data: AdminData): AdminPermissions => {
    if (!data || data.user_type !== 'admin') {
      return {
        canManageAllUsers: false,
        canManageCountryUsers: false,
        canCreateOwnerAdmins: false,
        canCreateBasicAdmins: false,
        canViewAllPayments: false,
        canViewCountryPayments: false,
        canViewPayments: false,
        canRemoveAdmins: false,
        canApproveProperties: false,
        canRejectProperties: false,
        canEscalateToHigherAdmin: false,
        canViewAllCountries: false,
        countryRestriction: null,
        countryFilter: null,
        displayRole: 'No Admin Access'
      };
    }

    const isSuper = data.admin_level === 'super';
    const isOwner = data.admin_level === 'owner';
    const isBasic = data.admin_level === 'basic';

    let displayRole = 'Admin Access';
    if (isSuper) {
      displayRole = 'Super Admin Access';
    } else if (isOwner && data.country_id) {
      // Get country name for display - for now use country_id
      displayRole = `Full ${data.country_id} Access`;  
    } else if (isBasic && data.country_id) {
      displayRole = `Basic ${data.country_id} Access`;
    }

    return {
      canManageAllUsers: isSuper,
      canManageCountryUsers: isOwner || isBasic,
      canCreateOwnerAdmins: isSuper,
      canCreateBasicAdmins: isSuper || isOwner,
      canViewAllPayments: isSuper,
      canViewCountryPayments: isOwner || isBasic,
      canViewPayments: true, // All admins can view payments
      canRemoveAdmins: isSuper || isOwner,
      canApproveProperties: true, // All admins can approve properties
      canRejectProperties: true, // All admins can reject properties  
      canEscalateToHigherAdmin: !isSuper, // Only non-super admins can escalate
      canViewAllCountries: isSuper,
      countryRestriction: isSuper ? null : data.country_id,
      countryFilter: isSuper ? null : data.country_id,
      displayRole
    };
  };

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 useAdminData: Fetching admin data from server API...');

      // Call our secure server API instead of direct Supabase calls
      const response = await fetch('/api/admin/dashboard', { 
        cache: 'no-store',
        credentials: 'include' // Include cookies for session
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('❌ useAdminData: Unauthorized - user not logged in');
          setAdminData(null);
          setPermissions(null);
          return;
        }
        
        if (response.status === 403) {
          console.log('❌ useAdminData: Forbidden - user not admin');
          throw new Error('Admin access required');
        }

        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ useAdminData: Server API response received');

      if (!data.profile) {
        console.log('❌ useAdminData: No profile data in response');
        setAdminData(null);
        setPermissions(null);
        return;
      }

      const adminData: AdminData = {
        id: data.profile.id,
        email: data.profile.email,
        user_type: data.profile.user_type,
        admin_level: data.profile.admin_level,
        country_id: data.profile.country_id,
        display_name: data.profile.display_name,
        first_name: data.profile.first_name,
        last_name: data.profile.last_name,
        created_by_admin: data.profile.created_by_admin,
        admin_created_at: data.profile.admin_created_at
      };

      // Use server-provided permissions if available, otherwise calculate
      const permissions = data.permissions || calculatePermissions(adminData);

      console.log('✅ useAdminData: Admin data processed successfully', {
        email: adminData.email,
        adminLevel: adminData.admin_level,
        displayRole: permissions.displayRole
      });

      setAdminData(adminData);
      setPermissions(permissions);

    } catch (err) {
      console.error('❌ useAdminData: Error fetching admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
      setAdminData(null);
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const refreshAdminData = async () => {
    await fetchAdminData();
  };

  const isAdmin = adminData?.user_type === 'admin';

  return {
    adminData,
    permissions,
    isAdmin,
    isLoading,
    error,
    refreshAdminData
  };
}

// Utility function to check if user has admin privileges for property creation
export function hasAdminPropertyPrivileges(adminData: AdminData | null): boolean {
  if (!adminData || adminData.user_type !== 'admin') {
    return false;
  }
  
  // Super and Owner admins get unlimited property creation
  return adminData.admin_level === 'super' || adminData.admin_level === 'owner';
}

// Utility function to get display name
export function getAdminDisplayName(adminData: AdminData | null): string {
  if (!adminData) return 'Unknown User';
  
  if (adminData.display_name) {
    return adminData.display_name;
  }
  
  if (adminData.first_name && adminData.last_name) {
    return `${adminData.first_name} ${adminData.last_name}`;
  }
  
  if (adminData.first_name) {
    return adminData.first_name;
  }
  
  return adminData.email.split('@')[0];
}