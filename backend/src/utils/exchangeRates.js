/**
 * Server-side exchange rate utilities
 */
export function getCurrencyCode(str) {
  if (!str) return 'USD';
  const match = str.match(/^[A-Z]{3}/i);
  if (match) return match[0].toUpperCase();
  if (str.includes('₹') || str.includes('INR')) return 'INR';
  if (str.includes('€') || str.includes('EUR')) return 'EUR';
  if (str.includes('£') || str.includes('GBP')) return 'GBP';
  if (str.includes('¥') || str.includes('JPY')) return 'JPY';
  if (str.includes('CAD')) return 'CAD';
  if (str.includes('AUD')) return 'AUD';
  if (str.includes('AED')) return 'AED';
  if (str.includes('SGD')) return 'SGD';
  if (str.includes('CHF')) return 'CHF';
  return 'USD';
}

export async function fetchLiveExchangeRate(fromStr, toStr) {
  const from = getCurrencyCode(fromStr);
  const to = getCurrencyCode(toStr);
  if (from === to) return 1.0;

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.[to]) {
        return Number(data.rates[to]);
      }
    }
  } catch (err) {
    console.warn('[SERVER EXCHANGE RATE FETCH]:', err.message);
  }

  try {
    const res2 = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2?.rates?.[to]) {
        return Number(data2.rates[to]);
      }
    }
  } catch (err2) {
    console.warn('[SERVER FRANKFURTER FETCH]:', err2.message);
  }

  // Live market baseline fallback rates
  const usdRates = {
    USD: 1.0,
    INR: 86.82,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.38,
    AUD: 1.54,
    JPY: 153.5,
    AED: 3.67,
    SGD: 1.35,
    CHF: 0.88,
  };

  const rateFrom = usdRates[from] || 1.0;
  const rateTo = usdRates[to] || 1.0;
  return rateTo / rateFrom;
}
