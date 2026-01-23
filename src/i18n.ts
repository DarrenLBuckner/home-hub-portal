// src/i18n.ts
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Supported locales
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

// Default locale (fallback)
export const defaultLocale: Locale = 'en';

// Get locale from various sources
async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();

    // 1. Check user preference cookie
    const preferredLocale = cookieStore.get('preferred-locale')?.value;
    if (preferredLocale && locales.includes(preferredLocale as Locale)) {
      return preferredLocale as Locale;
    }

    // 2. Check territory default language cookie (set by middleware)
    const territoryLanguage = cookieStore.get('territory-language')?.value;
    if (territoryLanguage && locales.includes(territoryLanguage as Locale)) {
      return territoryLanguage as Locale;
    }
  } catch {
    // Cookies may not be available during build
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await getLocale();

  return {
    locale,
    messages: {
      ...(await import(`./locales/${locale}/common.json`)).default,
      ...(await import(`./locales/${locale}/properties.json`)).default,
      ...(await import(`./locales/${locale}/auth.json`)).default,
      ...(await import(`./locales/${locale}/agents.json`)).default,
    },
  };
});
