import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_EMAILS_FALLBACK = ['hello@dotfreelancer.in', 'gelectra@gitam.edu'];

let adminApp: App | null = null;

function parseServiceAccount(): Record<string, string> | null {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) return null;

  adminApp = initializeApp({
    credential: cert(serviceAccount as never),
    projectId: serviceAccount.project_id,
  });
  return adminApp;
}

export function getFirestoreClient() {
  const app = getAdminApp();
  if (!app) return null;
  return getFirestore(app);
}

export function getAuthorizedAdminEmails(): string[] {
  const fromEnv = process.env.ADMIN_EMAILS;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return ADMIN_EMAILS_FALLBACK;
}

export async function verifyAdminIdToken(idToken: string): Promise<string> {
  const app = getAdminApp();
  if (!app) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT on Vercel.',
    );
  }
  const decoded = await getAuth(app).verifyIdToken(idToken);
  const email = (decoded.email ?? '').toLowerCase();
  if (!email) throw new Error('Token has no email claim.');
  const allowed = getAuthorizedAdminEmails();
  if (!allowed.includes(email)) {
    throw new Error('This account is not authorized to manage recruitment emails.');
  }
  return email;
}

export async function markEmailResult(
  docId: string,
  emailStatus: 'sent' | 'failed' | 'pending',
  emailError: string | null,
): Promise<void> {
  const firestore = getFirestoreClient();
  if (!firestore) return;
  const now = Date.now();
  await firestore.collection('applications').doc(docId).update({
    emailStatus,
    emailError,
    lastEmailAttemptAt: now,
    updatedAt: now,
  });
}
