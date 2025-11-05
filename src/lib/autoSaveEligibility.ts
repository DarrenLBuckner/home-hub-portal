// Auto-save eligibility for different user types in developing nation context
// Owner admins like Qumar are both admins AND active property managers

interface UserProfile {
  email?: string;
  user_type?: string;
  admin_level?: number;
}

const ADMIN_REGISTRY = {
  super: ['mrdarrenbuckner@gmail.com'] as string[],
  owner: ['qumar@guyanahomehub.com'] as string[], // Owner admins who are also active property managers
  basic: [] as string[] // System admins only - no property management
};

function getAdminLevel(email: string | undefined): 'super' | 'owner' | 'basic' | null {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  if (ADMIN_REGISTRY.super.includes(normalizedEmail)) return 'super';
  if (ADMIN_REGISTRY.owner.includes(normalizedEmail)) return 'owner';
  if (ADMIN_REGISTRY.basic.includes(normalizedEmail)) return 'basic';
  
  return null;
}

/**
 * Determines if a user should have auto-save functionality
 * 
 * AUTO-SAVE ENABLED FOR:
 * - Owner Admins (like Qumar) - Admin + active property manager
 * - Agents - Professional real estate agents
 * - Landlords - Property owners with multiple rentals
 * 
 * AUTO-SAVE DISABLED FOR:
 * - Basic Admins - System maintenance only
 * - FSBO - Individual/occasional users (simpler workflow better)
 * - Super Admins - Technical users who can handle data loss
 */
export function isAutoSaveEligible(userProfile: UserProfile): boolean {
  if (!userProfile) return false;

  const userType = userProfile.user_type?.toLowerCase();
  const adminLevel = getAdminLevel(userProfile.email);

  // Owner admins (like Qumar) - active property managers who are also admins
  if (adminLevel === 'owner') {
    return true;
  }

  // Regular user types that benefit from auto-save
  if (userType === 'agent' || userType === 'landlord') {
    return true;
  }

  // Exclude: super admins, basic admins, FSBO users
  return false;
}

/**
 * Get auto-save settings based on user type
 */
export function getAutoSaveSettings(userProfile: UserProfile): {
  enabled: boolean;
  interval: number; // milliseconds
  minFieldsRequired: number;
  label: string;
} {
  if (!isAutoSaveEligible(userProfile)) {
    return {
      enabled: false,
      interval: 0,
      minFieldsRequired: 0,
      label: ''
    };
  }

  const userType = userProfile.user_type?.toLowerCase();
  const adminLevel = getAdminLevel(userProfile.email);

  // Owner admins - most active users, save frequently
  if (adminLevel === 'owner') {
    return {
      enabled: true,
      interval: 20000, // 20 seconds - very active users
      minFieldsRequired: 2,
      label: 'Owner Admin Auto-save'
    };
  }

  // Agents - professional users, regular auto-save
  if (userType === 'agent') {
    return {
      enabled: true,
      interval: 30000, // 30 seconds - regular professional use
      minFieldsRequired: 3,
      label: 'Agent Auto-save'
    };
  }

  // Landlords - moderate frequency
  if (userType === 'landlord') {
    return {
      enabled: true,
      interval: 45000, // 45 seconds - less frequent use
      minFieldsRequired: 3,
      label: 'Landlord Auto-save'
    };
  }

  return {
    enabled: false,
    interval: 0,
    minFieldsRequired: 0,
    label: ''
  };
}