/**
 * Phone number normalization utilities
 * Ensures consistent phone number format across the application
 */

/**
 * Normalize phone/WhatsApp numbers to a consistent format
 * Keeps only digits and leading + sign, removes spaces, dashes, parentheses
 *
 * Examples:
 *   "+592-123-4567" -> "+5921234567"
 *   "(592) 123 4567" -> "5921234567"
 *   "+1 (555) 123-4567" -> "+15551234567"
 *   "592 123 4567" -> "5921234567"
 */
export function normalizePhoneNumber(phone: string | undefined | null): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except check for leading +
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) return null;

  // Return with + prefix if it had one, otherwise just digits
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}
