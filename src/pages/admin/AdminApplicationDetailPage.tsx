import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/FormControls';
import { Badge, EmptyState, LoadingSkeleton, StatusBadge } from '@/components/ui/Misc';
import { useToast } from '@/components/shared/Toast';
import {
  getApplication,
  updateApplicationStatus,
  updateEmailStatus,
} from '@/services/applicationsService';
import { resendApplicationConfirmation } from '@/services/emailApi';
import { auth } from '@/firebase/config';
import type { ApplicationDocument, ApplicationStatus } from '@/types';
import {
  ACADEMIC_YEAR_LABELS,
  BRANCH_LABELS,
  EXISTING_TEAM_LABELS,
  PORTFOLIO_LABELS,
  STATUS_LABELS,
} from '@/constants';
import { formatDateTime } from '@/utils';
import { useAdminProfile } from '@/pages/admin/AdminAuth';

function AnswerBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mist-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-mist-100">
        {value?.trim() ? value : '—'}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="w-48 shrink-0 text-xs font-medium uppercase tracking-[0.1em] text-mist-400">
        {label}
      </span>
      <span className="break-words text-sm text-mist-100">{value || '—'}</span>
    </div>
  );
}

export default function AdminApplicationDetailPage() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const profile = useAdminProfile();

  const [app, setApp] = useState<ApplicationDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>('submitted');
  const [savingStatus, setSavingStatus] = useState(false);
  const [resending, setResending] = useState(false);

  const load = useCallback(async () => {
    if (!docId) {
      setError('Missing application document ID.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getApplication(docId);
      if (!data) {
        setError('Application not found. It may have been archived or deleted.');
      } else {
        setApp(data);
        setStatus(data.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application.');
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStatusSave = async () => {
    if (!app || status === app.status) return;
    setSavingStatus(true);
    try {
      await updateApplicationStatus(app.id, status, profile?.email ?? 'unknown');
      setApp((prev) =>
        prev
          ? {
              ...prev,
              status,
              updatedAt: Date.now(),
              metadata: {
                ...prev.metadata,
                statusChangedAt: Date.now(),
                statusChangedBy: profile?.email ?? null,
              },
            }
          : prev,
      );
      push('success', 'Status updated', `Application marked as ${STATUS_LABELS[status]}.`);
    } catch (err) {
      push(
        'error',
        'Status update failed',
        err instanceof Error ? err.message : 'Try again.',
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const handleResendEmail = async () => {
    if (!app || resending) return;
    const user = auth?.currentUser;
    if (!user) {
      push('error', 'Not signed in', 'Sign in again to resend confirmation emails.');
      return;
    }
    setResending(true);
    try {
      const idToken = await user.getIdToken();
      const result = await resendApplicationConfirmation({
        idToken,
        docId: app.id,
        applicationId: app.applicationId,
        fullName: app.personal.fullName,
        registrationNumber: app.personal.registrationNumber,
        email: app.personal.email,
        phone: app.personal.phone,
        academicYear: app.personal.academicYear,
        branch: app.personal.branch,
        portfolio: app.application.portfolio,
        role: app.application.role,
        existingMember: app.application.existingMember,
        existingTeam: app.application.existingTeam,
      });
      if (!result.ok) {
        throw new Error(result.error ?? 'Resend failed.');
      }
      await updateEmailStatus(app.id, 'sent', null);
      setApp((prev) =>
        prev
          ? {
              ...prev,
              emailStatus: 'sent',
              emailError: null,
              lastEmailAttemptAt: Date.now(),
            }
          : prev,
      );
      push('success', 'Email sent', `Confirmation re-sent to ${app.personal.email}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Resend failed.';
      try {
        await updateEmailStatus(app.id, 'failed', message);
      } catch {
        // ignore secondary write failure
      }
      setApp((prev) =>
        prev
          ? { ...prev, emailStatus: 'failed', emailError: message, lastEmailAttemptAt: Date.now() }
          : prev,
      );
      push('error', 'Resend failed', message);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={10} />;
  }

  if (error || !app) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8" />}
        title="Application unavailable"
        description={error ?? 'Not found.'}
        action={
          <div className="flex gap-2">
            <Button type="button" onClick={() => void load()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Retry
            </Button>
            <Link to="/admin/applications">
              <Button type="button" variant="secondary">
                Back to applications
              </Button>
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-mist-300 transition hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          <h2 className="font-display text-2xl font-bold text-white">{app.personal.fullName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-gold-300">{app.applicationId}</span>
            <StatusBadge status={app.status} label={STATUS_LABELS[app.status]} />
            <StatusBadge
              status={app.emailStatus}
              label={`Email: ${app.emailStatus}`}
            />
            {app.application.existingMember === true ? (
              <Badge className="bg-sky-500/15 text-sky-200 ring-sky-500/30">Existing member</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void load()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Reload
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleResendEmail()}
            loading={resending}
            leftIcon={<Mail className="h-4 w-4" />}
          >
            Resend confirmation email
          </Button>
          {app.photo.googleDriveUrl ? (
            <a
              href={app.photo.googleDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="button" variant="primary" leftIcon={<ExternalLink className="h-4 w-4" />}>
                Open photo
              </Button>
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-ink-850/70 p-5 shadow-card lg:col-span-2">
          <h3 className="font-display text-lg font-semibold text-white">Personal details</h3>
          <div className="mt-4 space-y-3">
            <DetailRow label="Full name" value={app.personal.fullName} />
            <DetailRow label="Registration number" value={app.personal.registrationNumber} />
            <DetailRow label="Email" value={app.personal.email} />
            <DetailRow label="Phone" value={app.personal.phone} />
            <DetailRow
              label="Academic year"
              value={ACADEMIC_YEAR_LABELS[app.personal.academicYear]}
            />
            <DetailRow
              label="Branch"
              value={BRANCH_LABELS[app.personal.branch] ?? app.personal.branch}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-ink-850/70 p-5 shadow-card">
          <h3 className="font-display text-lg font-semibold text-white">Application meta</h3>
          <div className="mt-4 space-y-3">
            <DetailRow label="Portfolio" value={PORTFOLIO_LABELS[app.application.portfolio]} />
            <DetailRow
              label="Role"
              value={app.application.role === 'CO_LEAD' ? 'Co-Lead' : 'Member'}
            />
            <DetailRow
              label="Existing member"
              value={
                app.application.existingMember === true
                  ? 'Yes'
                  : app.application.existingMember === false
                    ? 'No'
                    : '—'
              }
            />
            <DetailRow
              label="Existing team"
              value={
                app.application.existingTeam
                  ? EXISTING_TEAM_LABELS[app.application.existingTeam] ?? app.application.existingTeam
                  : '—'
              }
            />
            <DetailRow label="Submitted" value={formatDateTime(app.submittedAt)} />
            <DetailRow label="Last updated" value={formatDateTime(app.updatedAt)} />
            <DetailRow label="Email status" value={app.emailStatus} />
            {app.emailError ? <DetailRow label="Email error" value={app.emailError} /> : null}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-ink-850/70 p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Status management</h3>
            <p className="text-sm text-mist-300">
              Status changes are saved immediately and require an authorized admin.
            </p>
          </div>
          <div className="flex w-full max-w-md items-end gap-2 sm:w-auto">
            <Select
              id="status-select"
              label="New status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="flex-1"
            >
              {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              onClick={() => void handleStatusSave()}
              loading={savingStatus}
              disabled={status === app.status}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save
            </Button>
          </div>
        </div>
        {profile ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-mist-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            Signed in as {profile.email}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-ink-850/70 p-5 shadow-card">
        <h3 className="font-display text-lg font-semibold text-white">Application answers</h3>
        <div className="mt-4 grid gap-3">
          <AnswerBlock label="What do you think about us?" value={app.answers.opinion ?? ''} />
          <AnswerBlock label="Learning goals" value={app.answers.learningGoals ?? ''} />
          {app.answers.conflictHandling ? (
            <AnswerBlock label="Conflict handling" value={app.answers.conflictHandling} />
          ) : null}
          {app.answers.initiatives ? (
            <AnswerBlock label="Initiatives" value={app.answers.initiatives} />
          ) : null}
          {app.answers.leadershipExperience ? (
            <AnswerBlock label="Leadership experience" value={app.answers.leadershipExperience} />
          ) : null}
          {app.answers.taskPrioritization ? (
            <AnswerBlock label="Task prioritization" value={app.answers.taskPrioritization} />
          ) : null}
          {app.answers.coLeadMotivation ? (
            <AnswerBlock label="Co-Lead motivation" value={app.answers.coLeadMotivation} />
          ) : null}
          {app.answers.teamExperience ? (
            <AnswerBlock label="Team experience" value={app.answers.teamExperience} />
          ) : null}
          {app.answers.commitment ? (
            <AnswerBlock label="Commitment" value={app.answers.commitment} />
          ) : null}
        </div>
      </section>

      {app.photo.googleDriveUrl ? (
        <section className="rounded-2xl border border-white/10 bg-ink-850/70 p-5 shadow-card">
          <h3 className="font-display text-lg font-semibold text-white">Photo</h3>
          <p className="mt-1 text-sm text-mist-300">
            Google Drive link provided by the applicant (no proxying — open in a new tab).
          </p>
          <a
            href={app.photo.googleDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 break-all text-sm text-gold-300 hover:underline"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            {app.photo.googleDriveUrl}
          </a>
        </section>
      ) : null}
    </div>
  );
}
