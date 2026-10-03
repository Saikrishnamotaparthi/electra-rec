import { DEFAULT_SETTINGS, SEED_ADMIN_EMAILS } from '@/constants';
import type { ApplicationStatus } from '@/types';

/**
 * Built-in seed admins. Always authorized, even if Firestore rules or the
 * dynamic `admin_config/list` document are missing.
 * Runtime-added admins live in Firestore and are loaded via
 * `@/services/adminConfigService`.
 */
export const SEED_ADMINS: string[] = [...DEFAULT_SETTINGS.authorizedAdminEmails];

/** @deprecated Prefer SEED_ADMINS / seed list checks — kept for fallback paths. */
export const AUTHORIZED_ADMIN_EMAILS: string[] = [...SEED_ADMINS];

export const ADMIN_CONFIG_COLLECTION = 'admin_config';
export const ADMIN_CONFIG_DOC_ID = 'list';

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isSeedAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return SEED_ADMIN_EMAILS.includes(normalized as (typeof SEED_ADMIN_EMAILS)[number]);
}

/** True only for built-in seed admins (does not include dynamic admins). */
export function isAuthorizedAdminEmail(email: string | null | undefined): boolean {
  return isSeedAdminEmail(email);
}

export function isEmailInAdminList(
  email: string | null | undefined,
  adminEmails: string[],
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return adminEmails.includes(normalized);
}

export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string; dot: string }
> = {
  submitted: {
    label: 'Submitted',
    className: 'bg-gold-500/15 text-gold-300 ring-gold-500/30',
    dot: 'bg-gold-400',
  },
  reviewed: {
    label: 'Reviewed',
    className: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
    dot: 'bg-sky-400',
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
    dot: 'bg-rose-400',
  },
};
