import React from 'react';
import { DollarSign, IndianRupee, Euro, PoundSterling, JapaneseYen, Coins } from 'lucide-react';

/**
 * Currency metadata mappings
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'CAD', symbol: '$', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'AUD ($) - Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
  { code: 'AED', symbol: 'AED', label: 'AED (د.إ) - UAE Dirham' },
  { code: 'SGD', symbol: '$', label: 'SGD ($) - Singapore Dollar' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF (Fr) - Swiss Franc' },
];

/**
 * Extracts the 3-letter currency code (e.g. 'USD', 'INR', 'EUR')
 */
export function getCurrencyCode(currencyStr = 'USD ($)') {
  if (!currencyStr) return 'USD';
  const match = currencyStr.match(/^[A-Z]{3}/i);
  if (match) return match[0].toUpperCase();
  if (currencyStr.includes('₹') || currencyStr.includes('INR')) return 'INR';
  if (currencyStr.includes('€') || currencyStr.includes('EUR')) return 'EUR';
  if (currencyStr.includes('£') || currencyStr.includes('GBP')) return 'GBP';
  if (currencyStr.includes('¥') || currencyStr.includes('JPY')) return 'JPY';
  return 'USD';
}

/**
 * Extracts the clean currency symbol (e.g. '₹', '$', '€', '£')
 */
export function getCurrencySymbol(currencyStr = 'USD ($)') {
  if (!currencyStr) return '$';
  if (currencyStr.includes('₹')) return '₹';
  if (currencyStr.includes('€')) return '€';
  if (currencyStr.includes('£')) return '£';
  if (currencyStr.includes('¥')) return '¥';
  if (currencyStr.includes('AED')) return 'AED ';
  if (currencyStr.includes('CHF')) return 'CHF ';
  if (currencyStr.includes('$')) return '$';

  const code = getCurrencyCode(currencyStr);
  const found = SUPPORTED_CURRENCIES.find(c => c.code === code);
  return found ? found.symbol : '$';
}

/**
 * Formats a number with the user's currency symbol and standard locale formatting
 */
export function formatCurrency(amount, currencyStr = 'USD ($)') {
  const num = Number(amount) || 0;
  const symbol = getCurrencySymbol(currencyStr);
  const formattedNumber = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formattedNumber}`;
}

/**
 * Fetches the latest live exchange rate between two currency codes using Google / open exchange rates
 */
export async function fetchLiveExchangeRate(fromCurrency, toCurrency) {
  const fromCode = getCurrencyCode(fromCurrency);
  const toCode = getCurrencyCode(toCurrency);

  if (fromCode === toCode) return 1.0;

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${fromCode}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates[toCode]) {
        return data.rates[toCode];
      }
    }
  } catch (err) {
    console.warn('[EXCHANGE RATE FETCH FALLBACK]:', err.message);
  }

  // Secondary fallback exchange API (Frankfurter)
  try {
    const res2 = await fetch(`https://api.frankfurter.app/latest?from=${fromCode}&to=${toCode}`);
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && data2.rates && data2.rates[toCode]) {
        return data2.rates[toCode];
      }
    }
  } catch (err2) {
    console.warn('[FRANKFURTER FETCH ERROR]:', err2.message);
  }

  // Approximate static conversion fallbacks if offline / network error
  const usdRates = {
    USD: 1.0,
    INR: 86.8,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.38,
    AUD: 1.54,
    JPY: 153.5,
    AED: 3.67,
    SGD: 1.35,
    CHF: 0.88,
  };

  const rateFrom = usdRates[fromCode] || 1.0;
  const rateTo = usdRates[toCode] || 1.0;
  return rateTo / rateFrom;
}

/**
 * Dynamic React icon component matching the active currency (IndianRupee, DollarSign, Euro, PoundSterling, etc.)
 */
export const CurrencyIcon = ({ currency, className = '', size = 16, ...props }) => {
  const code = getCurrencyCode(currency);

  switch (code) {
    case 'INR':
      return <IndianRupee size={size} className={className} {...props} />;
    case 'EUR':
      return <Euro size={size} className={className} {...props} />;
    case 'GBP':
      return <PoundSterling size={size} className={className} {...props} />;
    case 'JPY':
      return <JapaneseYen size={size} className={className} {...props} />;
    case 'USD':
    case 'CAD':
    case 'AUD':
    case 'SGD':
      return <DollarSign size={size} className={className} {...props} />;
    default:
      return <Coins size={size} className={className} {...props} />;
  }
};
