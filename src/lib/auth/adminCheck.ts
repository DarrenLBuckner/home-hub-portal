import { createClient } from '@/supabase';
import { getUserAdminRole, AdminRole } from './permissions';

export async function isUserAdmin(userId: string): Promise<boolean> {
  const role = await getUserAdminRole(userId);
  return role !== null;
}

export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserAdminRole(userId);
  return role === 'super_admin';
}

export async function getUserRole(userId: string): Promise<AdminRole | null> {
  return getUserAdminRole(userId);
}

export async function requireAdmin(userId: string) {
  const isAdmin = await isUserAdmin(userId);
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

export async function requireSuperAdmin(userId: string) {
  const isSuperAdmin = await isUserSuperAdmin(userId);
  if (!isSuperAdmin) {
    throw new Error('Unauthorized: Super admin access required');
  }
}

export async function checkAdminAccess(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      console.log('Admin check failed: Profile not found or error:', error);
      return false;
    }
    
    const isAdmin = profile.user_type === 'admin' || profile.user_type === 'super_admin';
    console.log('Admin check result:', { userId: userId.slice(0, 8), userType: profile.user_type, isAdmin });
    
    return isAdmin;
  } catch (error) {
    console.error('Admin access check error:', error);
    return false;
  }
}

export async function checkAdminAccessWithClient(supabaseClient: any, userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('user_type')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      console.log('Admin check failed: Profile not found or error:', error);
      return false;
    }
    
    const isAdmin = profile.user_type === 'admin' || profile.user_type === 'super_admin';
    console.log('Admin check result:', { userId: userId.slice(0, 8), userType: profile.user_type, isAdmin });
    
    return isAdmin;
  } catch (error) {
    console.error('Admin access check error:', error);
    return false;
  }
}

export async function requireAdminAccess(userId: string): Promise<void> {
  const isAdmin = await checkAdminAccess(userId);
  
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
}

export function redirectToAdminLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/admin-login';
  }
}

export function redirectToDashboard(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard';
  }
}