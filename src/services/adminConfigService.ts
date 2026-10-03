import { doc, getDoc, onSnapshot, setDoc, type DocumentData } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  ADMIN_CONFIG_COLLECTION,
  ADMIN_CONFIG_DOC_ID,
  SEED_ADMINS,
  isSeedAdminEmail,
  isValidEmail,
  normalizeEmail,
} from '@/utils/adminAuth';

export type AdminConfigSnapshot = {
  emails: string[];
  updatedAt: number | null;
  updatedBy: string | null;
};

function configRef() {
  if (!db) return null;
  return doc(db, ADMIN_CONFIG_COLLECTION, ADMIN_CONFIG_DOC_ID);
}

function normalizeList(...lists: string[][]): string[] {
  const set = new Set<string>();
  for (const list of lists) {
    for (const raw of list) {
      const email = normalizeEmail(raw);
      if (email) set.add(email);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function emailsFromDoc(data: DocumentData | undefined): string[] {
  if (!data) return [];
  const emails = data.emails;
  if (!Array.isArray(emails)) return [];
  return emails.map((e) => String(e));
}

/** Seed admins + any runtime-added emails from Firestore. */
export async function fetchAdminEmails(): Promise<string[]> {
  const ref = configRef();
  if (!ref) return normalizeList(SEED_ADMINS);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return normalizeList(SEED_ADMINS);
    return normalizeList(SEED_ADMINS, emailsFromDoc(snap.data()));
  } catch (err) {
    console.warn('[adminConfig] fetchAdminEmails failed', err);
    return normalizeList(SEED_ADMINS);
  }
}

export async function fetchAdminConfig(): Promise<AdminConfigSnapshot> {
  const ref = configRef();
  if (!ref) {
    return { emails: normalizeList(SEED_ADMINS), updatedAt: null, updatedBy: null };
  }
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { emails: normalizeList(SEED_ADMINS), updatedAt: null, updatedBy: null };
    }
    const data = snap.data() ?? {};
    return {
      emails: normalizeList(SEED_ADMINS, emailsFromDoc(data)),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : null,
      updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : null,
    };
  } catch (err) {
    console.warn('[adminConfig] fetchAdminConfig failed', err);
    return { emails: normalizeList(SEED_ADMINS), updatedAt: null, updatedBy: null };
  }
}

export function subscribeAdminEmails(cb: (emails: string[]) => void): () => void {
  const ref = configRef();
  if (!ref) {
    cb(normalizeList(SEED_ADMINS));
    return () => undefined;
  }
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        cb(normalizeList(SEED_ADMINS));
        return;
      }
      cb(normalizeList(SEED_ADMINS, emailsFromDoc(snap.data())));
    },
    (err) => {
      console.warn('[adminConfig] subscribeAdminEmails snapshot error', err);
      cb(normalizeList(SEED_ADMINS));
    },
  );
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  if (isSeedAdminEmail(normalized)) return true;
  const list = await fetchAdminEmails();
  return list.includes(normalized);
}

async function persistAdminEmails(emails: string[], actorEmail: string): Promise<string[]> {
  const ref = configRef();
  if (!ref) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_* in .env and restart.');
  }
  const next = normalizeList(emails);
  const payload: AdminConfigSnapshot & { updatedAt: number; updatedBy: string } = {
    emails: next,
    updatedAt: Date.now(),
    updatedBy: normalizeEmail(actorEmail),
  };
  await setDoc(ref, payload, { merge: true });
  return next;
}

export async function addAdminEmail(
  email: string,
  actorEmail: string,
): Promise<string[]> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Enter a valid email address.');
  }
  if (isSeedAdminEmail(normalized)) {
    throw new Error('This account is already a built-in administrator.');
  }
  const current = await fetchAdminEmails();
  if (current.includes(normalized)) {
    throw new Error('This account is already an administrator.');
  }
  return persistAdminEmails([...current, normalized], actorEmail);
}

export async function removeAdminEmail(
  email: string,
  actorEmail: string,
): Promise<string[]> {
  const normalized = normalizeEmail(email);
  if (isSeedAdminEmail(normalized)) {
    throw new Error('Built-in administrators cannot be removed. They are permanent seed accounts.');
  }
  const current = await fetchAdminEmails();
  if (!current.includes(normalized)) {
    throw new Error('Administrator not found.');
  }
  const remaining = current.filter((e) => e !== normalized);
  if (remaining.length < 1) {
    throw new Error('At least one administrator must remain on the list.');
  }
  return persistAdminEmails(remaining, actorEmail);
}
