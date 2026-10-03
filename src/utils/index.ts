export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function formatDate(ts: number | null | undefined): string {
  if (!ts) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(ts));
  } catch {
    return '—';
  }
}

export function formatDateTime(ts: number | null | undefined): string {
  if (!ts) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return '—';
  }
}

export function toDateInputValue(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isSafeText(value: string): boolean {
  // Reject script-ish payloads and control characters beyond normal text
  if (!value) return true;
  // eslint-disable-next-line no-control-regex
  return !/[<>]|javascript:/i.test(value);
}

export function sanitizeText(value: string): string {
  return value
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/\s{3,}/g, '  ')
    .trim();
}

export function normalizeRegNumber(reg: string): string {
  return reg.trim().toUpperCase().replace(/\s+/g, '');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
