// Currency utilities for Portal Home Hub - Global South Focus
// Supports dynamic currency adaptation for Caribbean and Africa markets

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  region: string;
}

// Global South Currencies - Caribbean and Africa Focus
export const CURRENCY_DATA: Record<string, CurrencyInfo> = {
  // Caribbean Markets
  GYD: {
    code: 'GYD',
    symbol: 'G$',
    name: 'Guyanese Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    region: 'Caribbean'
  },
  TTD: {
    code: 'TTD',
    symbol: 'TT$',
    name: 'Trinidad and Tobago Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    region: 'Caribbean'
  },
  JMD: {
    code: 'JMD',
    symbol: 'J$',
    name: 'Jamaican Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    region: 'Caribbean'
  },
  BBD: {
    code: 'BBD',
    symbol: 'Bds$',
    name: 'Barbadian Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    region: 'Caribbean'
  },
  
  // African Markets
  GHS: {
    code: 'GHS',
    symbol: 'GH₵',
    name: 'Ghanaian Cedi',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    region: 'Africa'
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    region: 'Africa'
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    region: 'Africa'
  }
};

// Country to currency mapping - Global South focus
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // Caribbean
  GY: 'GYD',
  TT: 'TTD', 
  JM: 'JMD',
  BB: 'BBD',
  
  // Africa
  GH: 'GHS',
  NG: 'NGN',
  KE: 'KES'
};

/**
 * Get currency information for a country
 */
export function getCurrencyForCountry(countryCode: string): CurrencyInfo {
  const currencyCode = COUNTRY_CURRENCY_MAP[countryCode] || 'GYD';
  return CURRENCY_DATA[currencyCode] || CURRENCY_DATA.GYD;
}

/**
 * Format currency amount with proper symbol and formatting
 */
export function formatCurrency(
  amount: number, 
  countryCode: string,
  options: { compact?: boolean; showSymbol?: boolean } = {}
): string {
  const { compact = false, showSymbol = true } = options;
  const currency = getCurrencyForCountry(countryCode);
  
  // Handle compact formatting for large numbers
  if (compact && amount >= 1000000) {
    const millions = amount / 1000000;
    const formatted = millions.toFixed(1) + 'M';
    return showSymbol ? `${currency.symbol}${formatted}` : formatted;
  } else if (compact && amount >= 1000) {
    const thousands = amount / 1000;
    const formatted = thousands.toFixed(1) + 'K';
    return showSymbol ? `${currency.symbol}${formatted}` : formatted;
  }
  
  // Standard formatting
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces
  });
  
  if (!showSymbol) return formatted;
  
  return currency.symbolPosition === 'before' 
    ? `${currency.symbol}${formatted}`
    : `${formatted}${currency.symbol}`;
}

/**
 * Get currency symbol for a country
 */
export function getCurrencySymbol(countryCode: string): string {
  const currency = getCurrencyForCountry(countryCode);
  return currency.symbol;
}

/**
 * Get currency code for a country
 */
export function getCurrencyCode(countryCode: string): string {
  const currency = getCurrencyForCountry(countryCode);
  return currency.code;
}

/**
 * Parse currency string to number (removing symbols and formatting)
 */
export function parseCurrencyString(currencyString: string, countryCode: string): number {
  const currency = getCurrencyForCountry(countryCode);
  
  // Remove currency symbol and formatting
  let cleaned = currencyString
    .replace(currency.symbol, '')
    .replace(new RegExp(`\\${currency.thousandsSeparator}`, 'g'), '')
    .replace(currency.decimalSeparator, '.')
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Currency conversion tooltip helper for Global South markets
 * Note: In production, integrate with real-time exchange rate API
 */
export function getCurrencyConversionTooltip(
  amount: number,
  fromCountry: string,
  toCountry: string = 'GY'
): string {
  if (fromCountry === toCountry) return '';
  
  const fromCurrency = getCurrencyForCountry(fromCountry);
  const toCurrency = getCurrencyForCountry(toCountry);
  
  // Global South exchange rates (approximate) - replace with real API in production
  const exchangeRates: Record<string, number> = {
    // Caribbean conversions to GYD
    'TTD-GYD': 31,
    'JMD-GYD': 1.35,
    'BBD-GYD': 105,
    
    // Africa conversions to GYD  
    'GHS-GYD': 18,
    'NGN-GYD': 0.13,
    'KES-GYD': 1.45,
    
    // Reverse conversions (GYD to others)
    'GYD-TTD': 0.032,
    'GYD-JMD': 0.74,
    'GYD-BBD': 0.0095,
    'GYD-GHS': 0.056,
    'GYD-NGN': 7.7,
    'GYD-KES': 0.69,
    
    // Inter-Caribbean rates
    'TTD-JMD': 23,
    'JMD-TTD': 0.043,
    'BBD-TTD': 3.4,
    'TTD-BBD': 0.29,
    
    // Caribbean to Africa 
    'TTD-NGN': 238,
    'JMD-NGN': 10.3,
    'GHS-TTD': 1.75,
    'NGN-JMD': 0.097
  };
  
  const rateKey = `${fromCurrency.code}-${toCurrency.code}`;
  const rate = exchangeRates[rateKey];
  
  if (!rate) return '';
  
  const convertedAmount = amount * rate;
  const formatted = formatCurrency(convertedAmount, toCountry);
  
  return `≈ ${formatted} (${toCurrency.code})`;
}

/**
 * Get available currencies for dropdown
 */
export function getAvailableCurrencies(): Array<{ code: string; name: string; symbol: string }> {
  return Object.values(CURRENCY_DATA).map(currency => ({
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol
  }));
}

/**
 * Quick helper for Jamaica expansion - format price with country detection
 */
export function formatPrice(amountInCents: number, countryCode: 'GY' | 'JM'): string {
  const amount = amountInCents / 100;
  const symbol = countryCode === 'JM' ? 'J$' : 'G$';
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * Validate currency amount format
 */
export function isValidCurrencyAmount(value: string, countryCode: string): boolean {
  const currency = getCurrencyForCountry(countryCode);
  
  // Allow empty string
  if (!value.trim()) return true;
  
  // Remove currency symbol if present
  const cleaned = value.replace(currency.symbol, '').trim();
  
  // Check if it's a valid number format
  const numberRegex = new RegExp(
    `^\\d{1,3}(\\${currency.thousandsSeparator}\\d{3})*(\\${currency.decimalSeparator}\\d{1,${currency.decimalPlaces}})?$`
  );
  
  return numberRegex.test(cleaned) || /^\d+(\.\d{1,2})?$/.test(cleaned);
}