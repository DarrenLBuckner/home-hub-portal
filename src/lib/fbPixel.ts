/**
 * Facebook Pixel tracking utilities
 * Pixel ID: 1245060350797314
 *
 * IMPORTANT: Pixel only fires on Guyana and Portal domains.
 * Jamaica domains are excluded until their campaign launches.
 */

export const FB_PIXEL_ID = '1245060350797314';

/**
 * Check if pixel tracking should be enabled for the current domain
 * Only enabled for Guyana Home Hub and Portal Home Hub
 */
function isPixelEnabledDomain(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname.toLowerCase();

  // Allowed domains
  const isGuyanaOrPortal =
    hostname.includes('guyanahomehub.com') ||
    hostname.includes('portalhomehub.com') ||
    hostname === 'localhost';

  // Explicitly excluded domains
  const isJamaica = hostname.includes('jamaicahomehub');

  return isGuyanaOrPortal && !isJamaica;
}

/**
 * Track a standard Facebook Pixel event
 * Only fires on Guyana/Portal domains
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!isPixelEnabledDomain()) {
    console.log(`[Meta Pixel] Event "${eventName}" skipped - not a Guyana/Portal domain`);
    return;
  }

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
}

/**
 * Track CompleteRegistration event when an agent is approved and logs in
 */
export function trackAgentRegistration(agentData?: {
  country?: string;
}): void {
  trackEvent('CompleteRegistration', {
    content_name: 'Agent Registration',
    status: 'approved',
    ...(agentData?.country && { country: agentData.country }),
  });
}

/**
 * Track Lead event when a property listing is published
 */
export function trackPropertyListing(propertyData: {
  listingType: 'sale' | 'rent';
  price?: number;
  currency?: string;
}): void {
  trackEvent('Lead', {
    content_name: 'Property Listing',
    content_category: propertyData.listingType,
    ...(propertyData.price && { value: propertyData.price }),
    currency: propertyData.currency || 'GYD',
  });
}
