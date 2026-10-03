import { useState, type FormEvent } from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { SectionCard, Badge } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { useAdminProfile } from '@/pages/admin/AdminAuth';
import { useToast } from '@/components/shared/Toast';
import {
  addAdminEmail,
  removeAdminEmail,
} from '@/services/adminConfigService';
import { isSeedAdminEmail, normalizeEmail, SEED_ADMINS } from '@/utils/adminAuth';
import { useAdminEmails } from '@/pages/admin/useAdminEmails';
import {
  CLUB_NAME,
  CLUB_TAGLINE,
  DEPARTMENT,
  RECRUITMENT_YEAR,
  UNIVERSITY,
} from '@/constants';
import { isFirebaseConfigured } from '@/firebase/config';

export default function AdminSettingsPage() {
  const profile = useAdminProfile();
  const { push } = useToast();
  const { emails, loading } = useAdminEmails();
  const [draftEmail, setDraftEmail] = useState('');
  const [busy, setBusy] = useState<'add' | string | null>(null);

  const currentEmail = profile ? normalizeEmail(profile.email) : '';

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentEmail || busy) return;
    const email = normalizeEmail(draftEmail);
    if (!email) return;
    setBusy('add');
    try {
      await addAdminEmail(email, currentEmail);
      setDraftEmail('');
      push('success', 'Admin added', `${email} can now sign in to the admin portal.`);
    } catch (err) {
      push(
        'error',
        'Could not add admin',
        err instanceof Error ? err.message : 'Unknown error.',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async (email: string) => {
    if (!currentEmail || busy) return;
    if (isSeedAdminEmail(email)) return;
    if (email === currentEmail) {
      push(
        'error',
        'Cannot remove yourself',
        'Ask another admin to remove this account if needed.',
      );
      return;
    }
    setBusy(`remove:${email}`);
    try {
      await removeAdminEmail(email, currentEmail);
      push('success', 'Admin removed', `${email} no longer has admin access.`);
    } catch (err) {
      push(
        'error',
        'Could not remove admin',
        err instanceof Error ? err.message : 'Unknown error.',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Settings</h2>
        <p className="mt-1 text-sm text-mist-300">
          Recruitment configuration and admin access management.
        </p>
      </div>

      <SectionCard title="Club & recruitment">
        <div className="space-y-3 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="w-48 text-xs font-medium uppercase tracking-[0.1em] text-mist-400">
              Club
            </span>
            <span className="text-mist-100">
              {CLUB_NAME} — {CLUB_TAGLINE}
            </span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="w-48 text-xs font-medium uppercase tracking-[0.1em] text-mist-400">
              Department
            </span>
            <span className="text-mist-100">{DEPARTMENT}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="w-48 text-xs font-medium uppercase tracking-[0.1em] text-mist-400">
              University
            </span>
            <span className="text-mist-100">{UNIVERSITY}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="w-48 text-xs font-medium uppercase tracking-[0.1em] text-mist-400">
              Recruitment year
            </span>
            <span className="font-mono text-gold-300">{RECRUITMENT_YEAR}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="w-48 text-xs font-medium uppercase tracking-[0.1em] text-mist-400">
              Firebase
            </span>
            <span className={isFirebaseConfigured ? 'text-emerald-300' : 'text-amber-300'}>
              {isFirebaseConfigured ? 'Configured' : 'Not configured'}
            </span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Authorized administrators"
        subtitle="Sign-in uses Google accounts on this list. Built-in seed admins cannot be removed; additional admins can be added or removed here."
      >
        <form onSubmit={handleAdd} className="mb-5 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Input
              label="Add administrator"
              type="email"
              name="adminEmail"
              placeholder="name@example.com"
       