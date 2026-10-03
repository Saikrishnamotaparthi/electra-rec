import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/utils';
import { useToast } from '@/components/shared/Toast';
import { signOutAdmin } from '@/services/adminAuthService';
import { useAdminProfile } from '@/pages/admin/AdminAuth';
import { CLUB_NAME, LOGO_ALT, LOGO_PATH } from '@/constants';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/exports', label: 'Exports', icon: Download },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

export default function AdminLayout() {
  const profile = useAdminProfile();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutAdmin();
      push('info', 'Signed out', 'You have been logged out of the admin portal.');
      navigate('/admin', { replace: true });
    } catch {
      push('error', 'Sign-out failed', 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 font-body">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-ink-900 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Admin navigation"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <img
            src={LOGO_PATH}
            alt={LOGO_ALT}
            className="h-11 w-11 rounded-full object-contain shadow-gold-sm"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-white">{CLUB_NAME}</p>
            <p className="truncate text-[11px] uppercase tracking-[0.14em] text-mist-400">
              Admin Portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-mist-300 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gold-500/15 text-gold-200 ring-1 ring-gold-500/30'
                    : 'text-mist-200 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          {profile ? (
            <div className="mb-3 rounded-xl bg-white/[0.03] p-3">
              <p className="truncate text-sm font-medium text-white">{profile.displayName}</p>
              <p className="truncate text-xs text-mist-400">{profile.email}</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-ink-950/90 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl border border-white/10 p-2 text-mist-200 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-base font-semibold text-white sm:text-lg">
              Recruitment Control Center
            </h1>
            <p className="hidden text-xs text-mist-400 sm:block">
              Manage applications, reviews, exports and analytics
            </p>
          </div>
          <Link
            to="/apply"
            className="ml-auto hidden rounded-xl bg-gold-500/15 px-3.5 py-2 text-xs font-semibold text-gold-200 ring-1 ring-gold-500/30 transition hover:bg-gold-500/25 sm:inline-flex"
          >
            View public form
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
