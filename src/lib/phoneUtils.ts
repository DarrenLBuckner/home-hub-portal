/**
 * Phone number normalization utilities
 * Ensures consistent phone number format across the application
 */

/**
 * Normalize phone/WhatsApp numbers to a consistent format
 * ALWAYS adds + prefix for international format (required by database)
 * Removes spaces, dashes, parentheses
 *
 * Examples:
 *   "+592-123-4567" -> "+5921234567"
 *   "(592) 123 4567" -> "+5921234567"
 *   "+1 (555) 123-4567" -> "+15551234567"
 *   "592 123 4567" -> "+5921234567"
 *   "5926227446" -> "+5926227446"
 */
export function normalizePhoneNumber(phone: string | undefined | null): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) return null;

  // ALWAYS return with + prefix for international format
  // Database CHECK constraint requires phone numbers to start with +
  return `+${digitsOnly}`;
}
