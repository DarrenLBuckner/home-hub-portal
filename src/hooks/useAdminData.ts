import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/supabase';
import { AdminPermissions, getAdminPermissions } from '@/lib/auth/adminPermissions';

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
  account_code: string | null;
}

// AdminPermissions interface is now imported from adminPermissions.ts
interface ExtendedAdminPermissions extends AdminPermissions {
  // Add any hook-specific permissions here
  displayRole: string;
}

interface UseAdminDataReturn {
  adminData: AdminData | null;
  permissions: ExtendedAdminPermissions | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  refreshAdminData: () => Promise<void>;
}

interface AdminState {
  adminData: AdminData | null;
  permissions: ExtendedAdminPermissions | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  adminData: null,
  permissions: null,
  isLoading: true,
  error: null,
};

function calculatePermissions(data: AdminData): ExtendedAdminPermissions {
  const basePermissions = getAdminPermissions(
    data.user_type,
    data.email,
    data.admin_level,
    data.country_id,
    null
  );

  let displayRole = 'No Admin Access';
  if (data.user_type === 'admin') {
    if (data.admin_level === 'super') {
      displayRole = 'Super Admin Access';
    } else if (data.admin_level === 'owner' && data.country_id) {
      displayRole = `Full ${data.country_id} Access`;
    } else if (data.admin_level === 'basic' && data.country_id) {
      displayRole = `Basic ${data.country_id} Access`;
    } else {
      displayRole = 'Admin Access';
    }
  }

  return { ...basePermissions, displayRole };
}

export function useAdminData(): UseAdminDataReturn {
  const [state, setState] = useState<AdminState>(initialState);

  const fetchAdminData = useCallback(async () => {
    setState(prev => prev.isLoading ? prev : { ...prev, isLoading: true, error: null });

    try {
      const response = await fetch('/api/admin/dashboard', {
        cache: 'no-store',
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setState({ adminData: null, permissions: null, isLoading: false, error: null });
          return;
        }

        if (response.status === 403) {
          throw new Error('Admin access required');
        }

        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.profile) {
        setState({ adminData: null, permissions: null, isLoading: false, error: null });
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
        admin_created_at: data.profile.admin_created_at,
        account_code: data.profile.account_code
      };

      const permissions = calculatePermissions(adminData);

      // Single state update — one render
      setState({ adminData, permissions, isLoading: false, error: null });

    } catch (err) {
      setState({
        adminData: null,
        permissions: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load admin data',
      });
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const isAdmin = state.adminData?.user_type === 'admin';

  return {
    adminData: state.adminData,
    permissions: state.permissions,
    isAdmin,
    isLoading: state.isLoading,
    error: state.error,
    refreshAdminData: fetchAdminData,
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