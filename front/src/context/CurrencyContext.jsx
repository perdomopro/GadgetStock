/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useMemo, useCallback } from 'react';

export const CurrencyContext = createContext(null);

export const DEFAULT_EXCHANGE_RATE = 20.0; // 1 USD = 20.0 MXN

export function CurrencyProvider({
  children,
  initialCurrency = 'USD',
  initialExchangeRate = DEFAULT_EXCHANGE_RATE,
  initialConvertEnabled = false,
}) {
  const [currency, setCurrency] = useState(initialCurrency); // 'USD' | 'MXN'
  const [exchangeRate, setExchangeRate] = useState(initialExchangeRate);
  const [convertEnabled, setConvertEnabled] = useState(initialConvertEnabled);

  const toggleCurrency = useCallback(() => {
    setCurrency((prev) => (prev === 'USD' ? 'MXN' : 'USD'));
  }, []);

  /**
   * Formats a numeric amount according to current currency mode.
   * - In USD: "$1,234.56"
   * - In MXN: "$1,234.56 MXN" (or converted "$24,691.20 MXN" if conversion enabled)
   *
   * @param {number|string} amount - The amount to format
   * @param {Object} [options] - Optional override { convert: boolean }
   * @returns {string} Formatted currency string
   */
  const formatCurrency = useCallback((amount, options = {}) => {
    if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
      return currency === 'USD' ? '$0.00' : '$0.00 MXN';
    }

    const num = Number(amount);
    const shouldConvert = options.convert !== undefined ? options.convert : convertEnabled;

    const targetValue = currency === 'USD' ? num : (shouldConvert ? num * exchangeRate : num);
    const absFormatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(targetValue));
    const sign = targetValue < 0 && absFormatted !== '0.00' ? '-' : '';

    if (currency === 'USD') {
      return `${sign}$${absFormatted}`;
    } else {
      // MXN mode
      return `${sign}$${absFormatted} MXN`;
    }
  }, [currency, exchangeRate, convertEnabled]);

  const value = useMemo(() => ({
    currency,
    setCurrency,
    toggleCurrency,
    exchangeRate,
    setExchangeRate,
    convertEnabled,
    setConvertEnabled,
    formatCurrency,
  }), [currency, toggleCurrency, exchangeRate, convertEnabled, formatCurrency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export default CurrencyContext;
