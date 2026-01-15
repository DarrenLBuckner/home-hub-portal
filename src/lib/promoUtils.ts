/**
 * Promo period utilities
 * Handles checking and managing promotional periods for users
 *
 * Database columns used:
 * - promo_start_date: When the promo period started
 * - promo_end_date: When the promo period ends
 * - promo_type: Type of promotion (e.g., 'founding', 'trial', 'discount')
 * - is_founding_member: Boolean flag for founding agent status
 */

export interface UserPromoData {
  promo_start_date?: string | null;
  promo_end_date?: string | null;
  promo_type?: string | null;
  is_founding_member?: boolean;
}

/**
 * Check if a user is currently in an active promo period
 * @param user - User profile data with promo fields
 * @returns true if the user is in an active promo period
 */
export function isInPromoPeriod(user: UserPromoData): boolean {
  if (!user.promo_end_date) return false;

  const now = new Date();
  const endDate = new Date(user.promo_end_date);
  const startDate = user.promo_start_date
    ? new Date(user.promo_start_date)
    : new Date(0);

  return now >= startDate && now <= endDate;
}

/**
 * Get the type of promotion a user has
 * @param user - User profile data with promo fields
 * @returns The promo type string or null if no promo
 */
export function getPromoType(user: UserPromoData): string | null {
  // Founding members take precedence
  if (user.is_founding_member) return 'founding';
  return user.promo_type || null;
}

/**
 * Get the number of days remaining in a user's promo period
 * @param user - User profile data with promo fields
 * @returns Number of days remaining, or 0 if not in promo period
 */
export function getPromoDaysRemaining(user: UserPromoData): number {
  if (!user.promo_end_date) return 0;

  const now = new Date();
  const endDate = new Date(user.promo_end_date);

  if (now > endDate) return 0;

  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if user is a founding member (special status with lifetime benefits)
 * @param user - User profile data
 * @returns true if the user is a founding member
 */
export function isFoundingMember(user: UserPromoData): boolean {
  return user.is_founding_member === true;
}

/**
 * Get promo badge display info
 * @param user - User profile data
 * @returns Object with badge text and color class, or null if no badge
 */
export function getPromoBadge(user: UserPromoData): {
  text: string;
  colorClass: string;
} | null {
  if (isFoundingMember(user)) {
    return {
      text: 'Founding Agent',
      colorClass: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  }

  if (isInPromoPeriod(user)) {
    const daysLeft = getPromoDaysRemaining(user);
    const promoType = user.promo_type || 'trial';

    if (promoType === 'trial') {
      return {
        text: `Trial: ${daysLeft} days left`,
        colorClass: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    }

    return {
      text: `Promo: ${daysLeft} days left`,
      colorClass: 'bg-green-100 text-green-800 border-green-300',
    };
  }

  return null;
}
