const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency = 'USD'): string {
  let fmt = currencyFormatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 });
    currencyFormatters.set(currency, fmt);
  }
  return fmt.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

export function formatDate(iso: string | Date): string {
  return dateFormatter.format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** Formats a date-only ISO string (YYYY-MM-DD) without timezone drift. */
export function formatReleaseMonth(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number);
  return monthFormatter.format(new Date(y, (m || 1) - 1, 1));
}

export function percentOff(regular: number, sale: number): number {
  if (regular <= 0) return 0;
  return Math.round(((regular - sale) / regular) * 100);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  partially_paid: 'Partially paid',
  paid_demo: 'Paid (demo)',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
