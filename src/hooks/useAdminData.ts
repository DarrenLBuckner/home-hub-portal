import { useState, useEffect } from 'react';
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

export function useAdminData(): UseAdminDataReturn {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [permissions, setPermissions] = useState<ExtendedAdminPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculatePermissions = (data: AdminData): ExtendedAdminPermissions => {
    // DEBUG: Log what we're passing to getAdminPermissions
    console.log('🔍 calculatePermissions - Input data:', {
      user_type: data.user_type,
      email: data.email, 
      admin_level: data.admin_level,
      country_id: data.country_id
    });

    // Get base permissions from main adminPermissions.ts
    const basePermissions = getAdminPermissions(
      data.user_type, 
      data.email, 
      data.admin_level,
      data.country_id, // Keep as string - don't convert to Number
      null // country name - we'll handle this later
    );

    // DEBUG: Log what permissions we got back
    console.log('🔍 calculatePermissions - Result permissions:', {
      canAccessDiagnostics: basePermissions.canAccessDiagnostics,
      canAccessSystemSettings: basePermissions.canAccessSystemSettings,
      canAccessPricingManagement: basePermissions.canAccessPricingManagement
    });

    // Add display role for UI
    let displayRole = 'No Admin Access';
    if (data.user_type === 'admin') {
      const isSuper = data.admin_level === 'super';
      const isOwner = data.admin_level === 'owner';
      const isBasic = data.admin_level === 'basic';

      if (isSuper) {
        displayRole = 'Super Admin Access';
      } else if (isOwner && data.country_id) {
        displayRole = `Full ${data.country_id} Access`;  
      } else if (isBasic && data.country_id) {
        displayRole = `Basic ${data.country_id} Access`;
      } else {
        displayRole = 'Admin Access';
      }
    }

    return {
      ...basePermissions,
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
        admin_created_at: data.profile.admin_created_at,
        account_code: data.profile.account_code
      };

      // DEBUG: Check what server is returning
      console.log('🔍 Server response - data.permissions:', data.permissions);
      
      // FORCE client-side calculation for now to bypass server issue
      const permissions = calculatePermissions(adminData);
      
      console.log('🔍 Final permissions after calculation:', permissions);

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