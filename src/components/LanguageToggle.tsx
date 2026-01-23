// src/components/LanguageToggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Espanol', flag: '🇪🇸' },
] as const;

type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

interface LanguageToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown' | 'compact';
}

export function LanguageToggle({ className = '', variant = 'button' }: LanguageToggleProps) {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get current language from cookie on mount
  useEffect(() => {
    setMounted(true);
    const preferredLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('preferred-locale='))
      ?.split('=')[1] as LanguageCode | undefined;

    const territoryLanguage = document.cookie
      .split('; ')
      .find(row => row.startsWith('territory-language='))
      ?.split('=')[1] as LanguageCode | undefined;

    setCurrentLang(preferredLocale || territoryLanguage || 'en');
  }, []);

  const toggleLanguage = (langCode: LanguageCode) => {
    // Set the cookie
    document.cookie = `preferred-locale=${langCode}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setCurrentLang(langCode);
    setIsOpen(false);

    // Refresh the page to apply the new language
    router.refresh();
  };

  // Don't render anything server-side to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
  const otherLanguage = SUPPORTED_LANGUAGES.find(l => l.code !== currentLang) || SUPPORTED_LANGUAGES[1];

  // Compact variant - just a simple toggle button
  if (variant === 'compact') {
    return (
      <button
        onClick={() => toggleLanguage(otherLanguage.code)}
        className={`flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        title={`Switch to ${otherLanguage.label}`}
      >
        <span>{otherLanguage.flag}</span>
        <span className="hidden sm:inline">{otherLanguage.code.toUpperCase()}</span>
      </button>
    );
  }

  // Button variant - toggle between two languages
  if (variant === 'button') {
    return (
      <button
        onClick={() => toggleLanguage(otherLanguage.code)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${className}`}
        title={`Switch to ${otherLanguage.label}`}
      >
        <span className="text-lg">{otherLanguage.flag}</span>
        <span className="text-sm font-medium text-gray-700">{otherLanguage.label}</span>
      </button>
    );
  }

  // Dropdown variant - for more than 2 languages
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-gray-700">{currentLanguage.label}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 w-40 rounded-lg bg-white shadow-lg border border-gray-200 z-20"
            role="listbox"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                  lang.code === currentLang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
                role="option"
                aria-selected={lang.code === currentLang}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.label}</span>
                {lang.code === currentLang && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageToggle;
