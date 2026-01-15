/**
 * Email Template Placeholder Replacement Utility
 * Replaces {{placeholder}} patterns with actual user data
 */

export interface UserContext {
  firstName: string;
  lastName: string;
  email: string;
  accountCode?: string;
  userType?: string;
  company?: string;
  phone?: string;
  countryId?: string;
  subscriptionStatus?: string;
  propertyCount?: number;
  createdAt?: string;
}

// Site name mapping based on country_id
const SITE_NAME_MAP: Record<string, string> = {
  'GY': 'Guyana HomeHub',
  'JM': 'Jamaica HomeHub',
};

export interface TemplateData {
  subject: string;
  body: string;
}

/**
 * Replaces all placeholders in a template with user context data
 * @param template - The template string containing {{placeholders}}
 * @param context - The user context data to replace placeholders with
 * @returns The processed string with all placeholders replaced
 */
export function replacePlaceholders(template: string, context: UserContext): string {
  if (!template) return '';

  // Derive site_name from country_id
  const siteName = SITE_NAME_MAP[context.countryId || ''] || 'HomeHub';

  // Format join_date from created_at
  const joinDate = context.createdAt
    ? new Date(context.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const replacements: Record<string, string> = {
    '{{first_name}}': context.firstName || '',
    '{{last_name}}': context.lastName || '',
    '{{full_name}}': `${context.firstName || ''} ${context.lastName || ''}`.trim(),
    '{{email}}': context.email || '',
    '{{account_code}}': context.accountCode || '',
    '{{user_type}}': context.userType || '',
    '{{company}}': context.company || '',
    '{{phone}}': context.phone || '',
    '{{country_id}}': context.countryId || '',
    '{{subscription_status}}': context.subscriptionStatus || '',
    '{{property_count}}': String(context.propertyCount ?? 0),
    '{{site_name}}': siteName,
    '{{join_date}}': joinDate,
  };

  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return result;
}

/**
 * Processes both subject and body of a template
 * @param template - Object containing subject and body templates
 * @param context - The user context data
 * @returns Processed subject and body with placeholders replaced
 */
export function processTemplate(template: TemplateData, context: UserContext): TemplateData {
  return {
    subject: replacePlaceholders(template.subject, context),
    body: replacePlaceholders(template.body, context),
  };
}

/**
 * Available placeholders for reference
 */
export const AVAILABLE_PLACEHOLDERS = [
  { placeholder: '{{first_name}}', description: 'User\'s first name' },
  { placeholder: '{{last_name}}', description: 'User\'s last name' },
  { placeholder: '{{full_name}}', description: 'User\'s full name' },
  { placeholder: '{{email}}', description: 'User\'s email address' },
  { placeholder: '{{account_code}}', description: 'User\'s account code' },
  { placeholder: '{{user_type}}', description: 'User type (agent/landlord/fsbo)' },
  { placeholder: '{{company}}', description: 'User\'s company name' },
  { placeholder: '{{phone}}', description: 'User\'s phone number' },
  { placeholder: '{{country_id}}', description: 'User\'s country code' },
  { placeholder: '{{subscription_status}}', description: 'Subscription status' },
  { placeholder: '{{property_count}}', description: 'Number of properties' },
  { placeholder: '{{site_name}}', description: 'Site name (e.g., Guyana HomeHub)' },
  { placeholder: '{{join_date}}', description: 'User\'s signup date' },
];
