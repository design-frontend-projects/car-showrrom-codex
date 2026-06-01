import { Temporal } from '@js-temporal/polyfill';

export function todayIso(): string {
  return Temporal.Now.plainDateISO().toString();
}

export function formatDate(value: string | Date, locale = 'en-US'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function addDaysIso(value: string, days: number): string {
  return Temporal.PlainDate.from(value).add({ days }).toString();
}
