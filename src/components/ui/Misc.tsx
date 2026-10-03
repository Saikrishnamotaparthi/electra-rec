import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

export function ProgressBar({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const pct = Math.min(100, Math.round((current / Math.max(total, 1)) * 100));
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold-300">{label}</p>
        <p className="font-mono text-xs text-mist-300">
          Step {current} / {total}
        </p>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-ink-750"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={label}
      >
        <motion.div
          className="h-full rounded-full bg-gold-linear"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-ink-850/70 bg-card-sheen p-5 shadow-card sm:p-6',
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? (
              <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
            ) : null}
            {subtitle ? <p className="mt-1 text-sm text-mist-300">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'gold',
  hint,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: 'gold' | 'white' | 'green' | 'blue' | 'rose';
  hint?: string;
}) {
  const tones: Record<string, string> = {
    gold: 'from-gold-500/20 text-gold-200',
    white: 'from-white/15 text-white',
    green: 'from-emerald-500/20 text-emerald-200',
    blue: 'from-sky-500/20 text-sky-200',
    rose: 'from-rose-500/20 text-rose-200',
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-850/80 p-4 shadow-card sm:p-5">
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-bl to-transparent blur-2xl',
          tones[tone],
        )}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-mist-400">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{value}</p>
          {hint ? <p className="mt-1 text-xs text-mist-400">{hint}</p> : null}
        </div>
        {icon ? <div className="rounded-xl bg-white/5 p-2 text-gold-300">{icon}</div> : null}
      </div>
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-ink-850/70 p-4 shadow-card sm:p-5',
        className,
      )}
    >
      <div className="mb-3">
        <h3 className="font-display text-sm font-semibold text-white sm:text-base">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-mist-400">{subtitle}</p> : null}
      </div>
      <div className="h-[260px] w-full">{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-ink-850/40 px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-gold-400/80">{icon}</div> : null}
      <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-mist-300">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-shimmer rounded-xl bg-gradient-to-r from-ink-750 via-ink-700 to-ink-750 bg-[length:200%_100%]"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  const map: Record<string, string> = {
    submitted: 'bg-gold-500/15 text-gold-200 ring-gold-500/30',
    reviewed: 'bg-sky-500/15 text-sky-200 ring-sky-500/30',
    shortlisted: 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30',
    rejected: 'bg-rose-500/15 text-rose-200 ring-rose-500/30',
    pending: 'bg-amber-500/15 text-amber-200 ring-amber-500/30',
    sent: 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30',
    failed: 'bg-rose-500/15 text-rose-200 ring-rose-500/30',
  };
  return (
    <Badge className={cn(map[status] ?? 'bg-white/10 text-mist-100 ring-white/10', className)}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'submitted' || status === 'pending'
            ? 'bg-gold-400'
            : status === 'reviewed'
              ? 'bg-sky-400'
              : status === 'shortlisted' || status === 'sent'
                ? 'bg-emerald-400'
                : 'bg-rose-400',
        )}
        aria-hidden="true"
      />
      {label}
    </Badge>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-850 p-6 shadow-card"
      >
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        {description ? <p className="mt-2 text-sm text-mist-300">{description}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl px-4 text-sm font-medium text-mist-200 ring-1 ring-white/10 transition hover:bg-white/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-11 rounded-xl bg-rose-600/90 px-4 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
