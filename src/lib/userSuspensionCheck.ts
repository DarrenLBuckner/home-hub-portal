// middleware/userSuspensionCheck.ts
import { createClient } from '@/supabase';

export async function checkUserSuspension(userId: string) {
  const supabase = createClient();
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_suspended, suspension_reason, suspended_at, suspended_by')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking user suspension:', error);
      return { suspended: false, reason: null };
    }

    return {
      suspended: profile?.is_suspended || false,
      reason: profile?.suspension_reason || null,
      suspendedAt: profile?.suspended_at || null,
      suspendedBy: profile?.suspended_by || null
    };
  } catch (error) {
    console.error('Error in checkUserSuspension:', error);
    return { suspended: false, reason: null };
  }
}

export async function getSuspensionAdminContact(countryId: string) {
  const supabase = createClient();
  
  try {
    // Get the Owner Admin for this country
    const { data: admin, error } = await supabase
      .from('profiles')
      .select('email, phone, first_name, last_name, display_name')
      .eq('country_id', countryId)
      .eq('admin_level', 'owner')
      .single();

    if (error || !admin) {
      // Fallback to Super Admin
      const { data: superAdmin } = await supabase
        .from('profiles')
        .select('email, phone, first_name, last_name, display_name')
        .eq('admin_level', 'super')
        .single();
      
      return superAdmin;
    }

    return admin;
  } catch (error) {
    console.error('Error getting suspension admin contact:', error);
    return null;
  }
}