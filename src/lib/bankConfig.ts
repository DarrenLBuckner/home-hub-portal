// Bank configuration for Guyana payment system
// TODO: Update with actual bank account details before production

export interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string;
  routing_number: string;
  swift_code: string;
  bank_address: string;
  payment_instructions: string[];
}

// Primary bank account for Portal Home Hub
export const PRIMARY_BANK_DETAILS: BankDetails = {
  bank_name: "Republic Bank (Guyana) Limited",
  account_name: "Portal Home Hub Ltd",
  account_number: "123-456-789", // TODO: Replace with actual account
  branch: "Main Branch Georgetown",
  routing_number: "123456", // TODO: Replace with actual routing number
  swift_code: "RBGYGYGE", // Republic Bank Guyana SWIFT code
  bank_address: "Main & Water Streets, Georgetown, Guyana",
  payment_instructions: [
    "Include your reference code in the transfer description/memo field",
    "Transfer the exact amount shown",
    "Payment expires in 24 hours",
    "Contact support if you need assistance: +592-705-9857"
  ]
};

// Alternative bank accounts (for load balancing or different regions)
export const ALTERNATIVE_BANK_DETAILS: BankDetails[] = [
  {
    bank_name: "Guyana Bank for Trade and Industry (GBTI)",
    account_name: "Portal Home Hub Ltd",
    account_number: "456-789-123", // TODO: Replace with actual account
    branch: "GBTI Main Branch",
    routing_number: "789456", // TODO: Replace with actual routing number
    swift_code: "GBTLGYGX", // GBTI SWIFT code
    bank_address: "47-48 Water Street, Georgetown, Guyana",
    payment_instructions: [
      "Include your reference code in the transfer description/memo field",
      "Transfer the exact amount shown",
      "Payment expires in 24 hours",
      "Contact support if you need assistance: +592-705-9857"
    ]
  },
  {
    bank_name: "Bank of Guyana",
    account_name: "Portal Home Hub Ltd",
    account_number: "987-654-321", // TODO: Replace with actual account
    branch: "Georgetown Main Branch",
    routing_number: "654321", // TODO: Replace with actual routing number
    swift_code: "BOGYGYGX", // Bank of Guyana SWIFT code
    bank_address: "1 Church Street, Georgetown, Guyana",
    payment_instructions: [
      "Include your reference code in the transfer description/memo field",
      "Transfer the exact amount shown",
      "Payment expires in 24 hours",
      "Contact support if you need assistance: +592-705-9857"
    ]
  }
];

// Bank selection logic
export function getBankDetails(region?: string, amount?: number): BankDetails {
  // For now, return primary bank
  // TODO: Implement logic for selecting bank based on region or amount
  return PRIMARY_BANK_DETAILS;
}

// Payment validation rules
export const PAYMENT_LIMITS = {
  min_amount_gyd: 100, // Minimum G$1.00
  max_amount_gyd: 50000000, // Maximum G$500,000
  max_daily_amount_gyd: 100000000, // G$1,000,000 daily limit per user
  reference_code_expiry_hours: 24,
  max_pending_references_per_user: 3
};

// Supported banks for customer transfers
export const SUPPORTED_BANKS = [
  {
    name: "Republic Bank (Guyana) Limited",
    code: "RBG",
    swift: "RBGYGYGE",
    online_banking: true,
    mobile_banking: true,
    popular: true
  },
  {
    name: "Guyana Bank for Trade and Industry (GBTI)",
    code: "GBTI",
    swift: "GBTLGYGX",
    online_banking: true,
    mobile_banking: true,
    popular: true
  },
  {
    name: "Bank of Guyana",
    code: "BOG", 
    swift: "BOGYGYGX",
    online_banking: true,
    mobile_banking: true,
    popular: false
  },
  {
    name: "Demerara Bank Limited",
    code: "DBL",
    swift: "DBLGGYGE",
    online_banking: true,
    mobile_banking: true,
    popular: true
  },
  {
    name: "Citizens Bank Guyana Inc",
    code: "CBG",
    swift: "CBGGGYGX",
    online_banking: true,
    mobile_banking: false,
    popular: false
  },
  {
    name: "Scotiabank (Guyana) Inc",
    code: "SBG",
    swift: "NOSCGYGX",
    online_banking: true,
    mobile_banking: true,
    popular: true
  },
  {
    name: "New Building Society Limited (NBS)",
    code: "NBS",
    swift: "NBSLGYGX",
    online_banking: true,
    mobile_banking: false,
    popular: false
  },
  {
    name: "Hand-in-Hand Mutual Life & General Insurance",
    code: "HIH",
    swift: null, // Insurance company, may not have SWIFT
    online_banking: false,
    mobile_banking: false,
    popular: false
  }
];

// Bank transfer fee structure
export const BANK_TRANSFER_FEES = {
  domestic: {
    fixed_fee_gyd: 0, // No additional fee for domestic transfers
    percentage_fee: 0,
    description: "No additional fees for domestic bank transfers"
  },
  international: {
    fixed_fee_gyd: 500000, // G$5,000 for international
    percentage_fee: 0.02, // 2% for international transfers
    description: "International transfer fees apply"
  }
};

// Helper functions
export function formatBankAccount(accountNumber: string): string {
  // Format account number for display (mask middle digits)
  if (accountNumber.length <= 6) return accountNumber;
  const start = accountNumber.substring(0, 3);
  const end = accountNumber.substring(accountNumber.length - 3);
  const middle = '*'.repeat(accountNumber.length - 6);
  return `${start}${middle}${end}`;
}

export function validateGuyanaPhoneNumber(phone: string): boolean {
  // Guyana phone number validation: +592-XXX-XXXX or 592XXXXXXX
  const phoneRegex = /^(\+592|592)[-\s]?[0-9]{3}[-\s]?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function formatGYD(amount: number): string {
  return `G$${amount.toLocaleString()}`;
}

export function parseGYD(amountStr: string): number {
  // Parse "G$1,000" to 1000
  return parseInt(amountStr.replace(/[G$,\s]/g, '')) || 0;
}

// Exchange rate configuration
export const EXCHANGE_RATES = {
  gyd_to_usd: 210, // 1 USD = 210 GYD (update regularly)
  last_updated: "2024-01-01T00:00:00Z", // TODO: Implement dynamic rates
  source: "Bank of Guyana",
  update_frequency_hours: 24
};

export function convertGYDToUSD(gydAmount: number): number {
  return Math.round((gydAmount / EXCHANGE_RATES.gyd_to_usd) * 100) / 100;
}

export function convertGYDToUSDCents(gydAmount: number): number {
  return Math.round((gydAmount / EXCHANGE_RATES.gyd_to_usd) * 100);
}