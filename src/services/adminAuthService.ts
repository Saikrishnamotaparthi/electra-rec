import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/firebase/config';
import { isAdminEmail } from '@/services/adminConfigService';
import { normalizeEmail } from '@/utils/adminAuth';
import type { AdminProfile } from '@/types';

export function subscribeAuth(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle(): Promise<{
  ok: boolean;
  profile?: AdminProfile;
  error?: string;
}> {
  if (!auth || !isFirebaseConfigured) {
    return {
      ok: false,
      error: 'Admin sign-in is temporarily unavailable. Please contact the club team.',
    };
  }
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const email = normalizeEmail(user.email);

    const authorized = await isAdminEmail(email);
    if (!authorized) {
      await signOut(auth);
      return {
        ok: false,
        error:
          'Access denied. This account is not authorized to access the G-ELECTRA Admin Portal.',
      };
    }

    return {
      ok: true,
      profile: {
        uid: user.uid,
        email,
        displayName: user.displayName ?? email,
        photoURL: user.photoURL,
        isAuthorized: true,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign-in failed';
    if (/popup-closed|user-cancelled|cancelled/i.test(message)) {
      return { ok: false, error: 'Google sign-in was cancelled.' };
    }
    return {
      ok: false,
      error: 'Unable to complete Google sign-in. Please try again.',
    };
  }
}

export async function signOutAdmin(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}
