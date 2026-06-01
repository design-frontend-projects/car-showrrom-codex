export function formatCurrency(value: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function formatMileage(value: number, locale = 'en-US'): string {
  return `${new Intl.NumberFormat(locale).format(value)} mi`;
}

export function formatCompactNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { notation: 'compact' }).format(value);
}
