// Centralized currency conversion utility for GYD to USD
// Update the conversion rate as needed or integrate with a currency API

export const GYD_TO_USD_RATE = 210; // Example: 1 USD = 210 GYD

export function convertGYDToUSD(gydAmount: number): number {
  // Returns USD amount in dollars
  return +(gydAmount / GYD_TO_USD_RATE).toFixed(2);
}

export function convertGYDToUSDCents(gydAmount: number): number {
  // Returns USD amount in cents (for Stripe)
  return Math.round((gydAmount / GYD_TO_USD_RATE) * 100);
}
