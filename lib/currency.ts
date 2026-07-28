// Exchange rates relative to USD base
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.5,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 155.0,
};

export function convertCurrency(amount: number, fromCurrency: string = "USD", toCurrency: string = "USD"): number {
  if (!amount || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;

  const fromRate = EXCHANGE_RATES[fromCurrency] || 1.0;
  const toRate = EXCHANGE_RATES[toCurrency] || 1.0;

  // Convert to USD base first, then convert to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}
