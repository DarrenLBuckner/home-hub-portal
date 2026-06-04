// src/lib/pricing-display.ts
//
// Shared "is this a custom-priced plan?" rule, used by both the pricing API
// (to keep a price=0 plan out of "starting from" minimums) and the agent
// registration cards (to render "Custom" instead of a currency amount).
//
// A plan is custom when it is explicitly flagged (features.custom_pricing) or
// has a zero price (the convention for Cornerstone = contact-sales). Keeping
// this in one place means PR-2 (FREE -> live prices) inherits it automatically.

export function isCustomPricePlan(plan: {
  price?: number | null;
  features?: { custom_pricing?: boolean } | null | any;
}): boolean {
  if (plan?.features?.custom_pricing === true) return true;
  return plan?.price === 0;
}
