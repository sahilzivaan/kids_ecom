/**
 * Formats a date string or Date object into YYYY-MON-DD format.
 * Example: 2026-JUN-05
 *
 * @param value - A date string, timestamp number, or Date object.
 * @param fallback - Optional fallback string if the date is invalid/empty.
 */
export function formatDate(value: string | number | Date | null | undefined, fallback = 'N/A'): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (isNaN(d.getTime())) return fallback;
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const yyyy = d.getFullYear();
  const mon  = months[d.getMonth()];
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mon}-${dd}`;
}

/**
 * Formats a date + time into YYYY-MON-DD HH:mm format.
 * Example: 2026-JUN-05 14:30
 *
 * @param value - A date string, timestamp number, or Date object.
 * @param fallback - Optional fallback string if the date is invalid/empty.
 */
export function formatDateTime(value: string | number | Date | null | undefined, fallback = 'N/A'): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (isNaN(d.getTime())) return fallback;
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const yyyy = d.getFullYear();
  const mon  = months[d.getMonth()];
  const dd   = String(d.getDate()).padStart(2, '0');
  const hh   = String(d.getHours()).padStart(2, '0');
  const mm   = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mon}-${dd} ${hh}:${mm}`;
}
