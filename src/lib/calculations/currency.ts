/**
 * Currency and Indian numbering format utilities
 */

export interface FormatOptions {
  currency?: string;
  showDecimals?: boolean;
  useIndianFormat?: boolean;
}

/**
 * Format a numeric amount into Indian Rupee (INR) representation or other currencies
 * e.g., 150000 -> "₹1,50,000"
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: FormatOptions = {}
): string {
  const {
    currency = 'INR',
    showDecimals = false,
    useIndianFormat = true
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return currency === 'INR' ? '₹0' : '0.00';
  }

  const sign = amount < 0 ? '-' : '';
  const absAmount = Math.abs(amount);

  if (currency === 'INR' && useIndianFormat) {
    const fixed = showDecimals ? absAmount.toFixed(2) : Math.round(absAmount).toString();
    const [integerPart, decimalPart] = fixed.split('.');

    // Indian numbering format: last 3 digits, then groups of 2
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

    const result = `${sign}₹${formattedInteger}${decimalPart ? '.' + decimalPart : ''}`;
    return result;
  }

  // Fallback / standard International formatting
  try {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    });
    return formatter.format(amount);
  } catch {
    return `${sign}${currency} ${absAmount.toLocaleString('en-IN')}`;
  }
}

/**
 * Format compact numbers for charts/badges, e.g. ₹1.5L, ₹2.4Cr, ₹25K
 */
export function formatCompactCurrency(amount: number, currency: string = 'INR'): string {
  if (Math.abs(amount) >= 10000000) {
    return `${currency === 'INR' ? '₹' : ''}${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `${currency === 'INR' ? '₹' : ''}${(amount / 100000).toFixed(1)}L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `${currency === 'INR' ? '₹' : ''}${(amount / 1000).toFixed(1)}k`;
  }
  return formatCurrency(amount, { currency, showDecimals: false });
}

/**
 * Parses user string input safely into a valid monetary number
 */
export function parseCurrencyInput(value: string | number): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : Math.round(value * 100) / 100;
  }
  if (!value) return 0;
  // Remove currency signs, commas, and spaces
  const cleaned = value.toString().replace(/[₹$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}
