// Feature flags for controlling payment and beta access
export const FEATURE_FLAGS = {
  // Set to false to give free access during beta
  REQUIRE_PAYMENT: process.env.NEXT_PUBLIC_REQUIRE_PAYMENT === 'true' || false,
  
  // Beta configuration
  FREE_BETA_ACTIVE: true,
  BETA_END_DATE: '2025-02-28',
  
  // Show pricing to set expectations
  SHOW_FUTURE_PRICING: true,
  
  // Payment methods available (when payment is required)
  PAYMENT_METHODS: {
    stripe: true,
    bank_transfer: false,  // Set to false until you have real bank account
    mobile_money: false
  },

  // Beta duration by user type (in days from registration)
  BETA_DURATION_DAYS: {
    agent: 45,
    fsbo: 90,
    landlord: 60
  }
};

// Helper function to check if beta has expired
export function isBetaExpired(): boolean {
  return new Date() > new Date(FEATURE_FLAGS.BETA_END_DATE);
}

// Helper function to get days remaining in beta
export function daysUntilBetaEnd(): number {
  const endDate = new Date(FEATURE_FLAGS.BETA_END_DATE);
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// Helper function to check if payment is actually required
export function isPaymentRequired(): boolean {
  // If beta is active and hasn't expired, no payment required
  if (FEATURE_FLAGS.FREE_BETA_ACTIVE && !isBetaExpired()) {
    return false;
  }
  
  // Otherwise, check the payment requirement flag
  return FEATURE_FLAGS.REQUIRE_PAYMENT;
}

// Helper function to get available payment methods
export function getAvailablePaymentMethods(): string[] {
  const methods: string[] = [];
  
  if (FEATURE_FLAGS.PAYMENT_METHODS.stripe) {
    methods.push('stripe');
  }
  
  if (FEATURE_FLAGS.PAYMENT_METHODS.bank_transfer) {
    methods.push('bank_transfer');
  }
  
  if (FEATURE_FLAGS.PAYMENT_METHODS.mobile_money) {
    methods.push('mobile_money');
  }
  
  return methods;
}

// Helper function to check if a specific payment method is enabled
export function isPaymentMethodEnabled(method: 'stripe' | 'bank_transfer' | 'mobile_money'): boolean {
  return FEATURE_FLAGS.PAYMENT_METHODS[method] || false;
}

// Helper function to get beta expiry date for a specific user type
export function getBetaExpiryDate(userType: string): string {
  const days = FEATURE_FLAGS.BETA_DURATION_DAYS[userType as keyof typeof FEATURE_FLAGS.BETA_DURATION_DAYS] || 60;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate.toISOString();
}

// Helper function to get beta status message
export function getBetaStatusMessage(): string {
  if (!FEATURE_FLAGS.FREE_BETA_ACTIVE) {
    return 'Beta period has ended';
  }
  
  if (isBetaExpired()) {
    return 'Beta period has expired';
  }
  
  const daysLeft = daysUntilBetaEnd();
  if (daysLeft === 0) {
    return 'Beta ends today';
  } else if (daysLeft === 1) {
    return 'Beta ends tomorrow';
  } else {
    return `Beta ends in ${daysLeft} days`;
  }
}

// Export default configuration
export default FEATURE_FLAGS;