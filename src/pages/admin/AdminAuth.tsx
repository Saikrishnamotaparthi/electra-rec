import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertOctagon, Loader2 } from 'lucide-react';
import {
  signInWithGoogle,
  signOutAdmin,
  subscribeAuth,
} from '@/services/adminAuthService';
import { isAdminEmail } from '@/services/adminConfigService';
import { normalizeEmail } from '@/utils/adminAuth';
import { Button } from '@/components/ui/Button';
import { CLUB_NAME, LOGO_ALT, LOGO_PATH } from '@/constants';
import { isFirebaseConfigured } from '@/firebase/config';
import type { AdminProfile } from '@/types';
import { useToast } from '@/components/shared/Toast';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'unauthorized'; email: string | null }
  | { status: 'authorized'; profile: AdminProfile };

const AdminProfileContext = createContext<AdminProfile | null>(null);

export function AdminAuthProvider({
  profile,
  children,
}: {
  profile: AdminProfile;
  children: ReactNode;
}) {
  return (
    <AdminProfileContext.Provider value={profile}>{children}</AdminProfileContext.Provider>
  );
}

export function useAdminProfile(): AdminProfile | null {
  return useContext(AdminProfileContext);
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <img src={LOGO_PATH} alt={LOGO_ALT} className="h-16 w-16 rounded-full object-contain opacity-90" />
      <Loader2 className="h-6 w-6 animate-spin text-gold-400" aria-hidden="true" />
      <p className="text-sm text-mist-300">Verifying admin access…</p>
    </div>
  );
}

function LoginPage({
  state,
  onSignIn,
  busy,
}: {
  state: { status: 'unauthenticated' } | { status: 'unauthorized'; email: string | null };
  onSignIn: () => void;
  busy: boolean;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ink-900 px-4 py-10 font-body">
      <div className="absolute inset-0 bg-hero-radial" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-ink-850/90 p-8 shadow-card"
      >
        <div className="flex flex-col items-center text-center">
          <img
            src={LOGO_PATH}
            alt={LOGO_ALT}
            className="h-20 w-20 rounded-full object-contain shadow-gold-sm"
          />
          <h1 className="mt-4 font-display text-xl font-bold text-white">{CLUB_NAME}</h1>
          <p className="text-xs uppercase tracking-[0.18em] text-mist-300">Admin Portal</p>
        </div>

        {state.status === 'unauthorized' ? (
          <div
            className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100"
            role="alert"
          >
            <p className="flex items-center gap-2 font-semibold">
              <AlertOctagon className="h-4 w-4 shrink-0" aria-hidden="true" />
              Access denied
            </p>
            <p className="mt-2">
              This account is not authorized to access the {CLUB_NAME} Admin Portal.
            </p>
            {state.email ? (
              <p className="mt-2 break-all text-xs text-rose-200/80">Signed in as {state.email}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-6 text-center text-sm text-mist-300">
            Sign in with an authorized Google account to manage recruitment applications.
          </p>
        )}

        <div className="mt-6">
          <Button
            type="button"
            fullWidth
            size="lg"
            onClick={onSignIn}
            loading={busy}
            className="bg-white text-ink-900 hover:bg-mist-100"
            leftIcon={<GoogleIcon />}
          >
            Continue with Google
          </Button>
        </div>

        {!isFirebaseConfigured ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-mist-300">
            Firebase is not configured. Set <code className="text-gold-300">VITE_FIREBASE_*</code>{' '}
            in <code className="text-gold-300">.env</code> to enable admin sign-in.
          </p>
        ) : null}

        <p className="mt-6 text-center text-[11px] leading-relaxed text-mist-500">
          Only authorized {CLUB_NAME} administrators can access this portal.
        </p>
      </motion.div>
    </div>
  );
}

export function AdminGuard() {
  const { push } = useToast();
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const unsub = subscribeAuth((user) => {
      if (!user) {
        setState({ status: 'unauthenticated' });
        return;
      }
      const email = normalizeEmail(user.email);
      void (async () => {
        const authorized = await isAdminEmail(email);
        if (cancelled) return;
        if (!authorized) {
          void signOutAdmin();
          setState({ status: 'unauthorized', email });
          return;
        }
        setState({
          status: 'authorized',
          profile: {
            uid: user.uid,
            email,
            displayName: user.displayName ?? email,
            photoURL: user.photoURL,
            isAuthorized: true,
          },
        });
      })();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const handleSignIn = async () => {
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);
    if (!result.ok) {
      push('error', 'Sign-in failed', result.error ?? 'Unable to sign in.');
      if (result.error?.toLowerCase().includes('not authorized')) {
        setState({ status: 'unauthorized', email: null });
      }
      return;
    }
    if (result.profile) {
      setState({ status: 'authorized', profile: result.profile });
      navigate('/admin/dashboard', { replace: true });
    }
  };

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-ink-900">
        <LoadingScreen />
      </div>
    );
  }

  if (state.status !== 'authorized') {
    return (
      <LoginPage
        state={state}
        onSignIn={handleSignIn}
        busy={busy}
      />
    );
  }

  return (
    <AdminAuthProvider profile={state.profile}>
      <Outlet />
    </AdminAuthProvider>
  );
}

export function AdminRedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    const unsub = subscri