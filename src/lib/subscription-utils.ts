// Global Video Upload Access Control for Portal Home Hub
// Works across ALL countries connected to Portal Home Hub
// src/lib/subscription-utils.ts

import { User } from '@supabase/supabase-js'

/**
 * GLOBAL VIDEO UPLOAD ACCESS CONTROL
 * 
 * This system works for:
 * - Guyana Home Hub (current)
 * - Jamaica Home Hub (future)
 * - Trinidad Home Hub (future) 
 * - All Caribbean/African markets (future)
 * 
 * Portal Home Hub is the central backend managing all countries.
 * Property creation happens HERE, so video access control belongs HERE.
 */

export interface UserProfile {
  id: string
  email: string
  subscription_tier?: string
  user_type?: string
  admin_level?: number
  country?: string
}

/**
 * Determines if a user can upload videos based on their subscription tier
 * TIER RULES (GLOBAL):
 * - Basic Agents (G$6,000): NO video access
 * - Pro Agents (G$11,000): Video access ✅
 * - Elite Agents (G$25,000): Video access ✅ 
 * - Admins/Super Admins: Full video access ✅
 * - High-tier Landlords/FSBOs: Video access ✅
 */
export function canUploadVideo(profile: UserProfile): boolean {
  if (!profile) return false

  // Admin/Super Admin/Owner Admin always get video access
  const userType = profile.user_type?.toLowerCase()
  if (userType === 'admin' || userType === 'superadmin' || userType === 'owner') {
    return true
  }
  
  // Also check admin_level for backwards compatibility
  if (profile.admin_level && profile.admin_level >= 1) {
    return true
  }

  // Check subscription tiers by user type
  const tier = profile.subscription_tier?.toLowerCase()

  if (userType === 'agent') {
    return tier === 'pro' || tier === 'elite'
  }

  if (userType === 'landlord') {
    // Only highest paying landlords get video access
    return tier === 'premium' || tier === 'elite'
  }

  if (userType === 'fsbo') {
    // Only highest paying FSBOs get video access  
    return tier === 'premium' || tier === 'portfolio'
  }

  // Default: no video access
  return false
}

/**
 * Gets upgrade message for users who can't upload videos
 */
export function getVideoUpgradeMessage(profile: UserProfile): string {
  const userType = profile.user_type?.toLowerCase()
  
  if (userType === 'agent') {
    return "Upgrade to Pro (G$11,000) or Elite (G$25,000) to add videos to your listings and increase engagement!"
  }
  
  if (userType === 'landlord') {
    return "Upgrade to Premium to add videos to your rental listings and attract more qualified tenants!"
  }
  
  if (userType === 'fsbo') {
    return "Upgrade to Premium or Portfolio to add videos to your property listings and sell faster!"
  }
  
  return "Upgrade your subscription to add videos to your property listings!"
}

/**
 * Gets user profile with all necessary subscription info
 */
export async function getUserProfile(user: User): Promise<UserProfile | null> {
  if (!user) return null

  try {
    // This would typically fetch from your user profiles table
    // For now, return the user data we have
    return {
      id: user.id,
      email: user.email || '',
      subscription_tier: (user.user_metadata?.subscription_tier || 'basic'),
      user_type: (user.user_metadata?.user_type || 'agent'),
      admin_level: (user.user_metadata?.admin_level || 0),
      country: (user.user_metadata?.country || 'GY')
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

/**
 * Global tier benefits lookup
 */
export function getTierBenefits(userType: string, tier: string) {
  if (!userType) return { canUploadVideo: false, maxPhotos: 0, maxListings: 0 }
  
  // Admin/Superadmin/Owner always gets full access
  if (userType === 'admin' || userType === 'superadmin' || userType === 'owner') {
    return { canUploadVideo: true, maxPhotos: 50, maxListings: 999 }
  }

  const benefits = {
    agent: {
      basic: { canUploadVideo: false, maxPhotos: 8, maxListings: 5 },
      pro: { canUploadVideo: true, maxPhotos: 15, maxListings: 20 },
      elite: { canUploadVideo: true, maxPhotos: 20, maxListings: 999 }
    },
    landlord: {
      basic: { canUploadVideo: false, maxPhotos: 8, maxListings: 1 },
      plus: { canUploadVideo: false, maxPhotos: 20, maxListings: 1 },
      portfolio: { canUploadVideo: true, maxPhotos: 50, maxListings: 3 },
      premium: { canUploadVideo: true, maxPhotos: 50, maxListings: 1 }
    },
    fsbo: {
      basic: { canUploadVideo: false, maxPhotos: 10, maxListings: 1 },
      plus: { canUploadVideo: false, maxPhotos: 15, maxListings: 1 },
      portfolio: { canUploadVideo: true, maxPhotos: 25, maxListings: 2 },
      premium: { canUploadVideo: true, maxPhotos: 30, maxListings: 1 }
    }
  }

  const userBenefits = benefits[userType.toLowerCase() as keyof typeof benefits]
  if (!userBenefits) return { canUploadVideo: false, maxPhotos: 5, maxListings: 1 }
  
  const tierBenefits = userBenefits[tier.toLowerCase() as keyof typeof userBenefits]
  return tierBenefits || { canUploadVideo: false, maxPhotos: 5, maxListings: 1 }
}