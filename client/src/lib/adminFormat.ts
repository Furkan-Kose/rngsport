/**
 * Admin panelinde para ve tarih biçimi tek yerden. Panel her zaman Türkçedir
 * (müşteri sitesinin dile göre biçimi: lib/format.ts).
 */
const money = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const dateOnly = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** ₺1.234 (kuruş varsa ₺1.234,5) */
export const formatMoney = (value: number | null | undefined) => `₺${money.format(Number(value) || 0)}`;

/** 23.10.2026 14:05 */
export const formatDateTime = (value: string | Date | null | undefined) =>
  value ? dateTime.format(new Date(value)) : '—';

/** 23.10.2026 */
export const formatDate = (value: string | Date | null | undefined) =>
  value ? dateOnly.format(new Date(value)) : '—';

/** 1.234 */
export const formatCount = (value: number | null | undefined) => money.format(Number(value) || 0);
