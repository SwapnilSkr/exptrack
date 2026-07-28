// Default fallback exchange rates relative to USD base
export let EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.5,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 155.0,
};

let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Fetch live exchange rates from open exchange rate API (no API key required)
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_DURATION_MS && Object.keys(EXCHANGE_RATES).length > 7) {
    return EXCHANGE_RATES;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        EXCHANGE_RATES = {
          ...EXCHANGE_RATES,
          ...data.rates,
        };
        lastFetchTime = now;
      }
    }
  } catch (err) {
    console.warn("Live exchange rate fetch failed, using built-in rates fallback:", err);
  }

  return EXCHANGE_RATES;
}

/**
 * Synchronously convert currency using stored exchange rates
 */
export function convertCurrency(amount: number, fromCurrency: string = "USD", toCurrency: string = "USD"): number {
  if (!amount || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;

  const fromRate = EXCHANGE_RATES[fromCurrency] || 1.0;
  const toRate = EXCHANGE_RATES[toCurrency] || 1.0;

  // Convert to USD base first, then convert to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}
