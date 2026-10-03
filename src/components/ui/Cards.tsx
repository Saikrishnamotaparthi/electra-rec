import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import type { Portfolio } from '@/types';
import {
  PORTFOLIO_DESCRIPTIONS,
  PORTFOLIO_LABELS,
  PORTFOLIO_ORDER,
} from '@/constants';
import { PenTool, Code2, Cpu, FileText, Megaphone, Palette } from 'lucide-react';

export const PORTFOLIO_ICONS: Record<Portfolio, ReactNode> = {
  MARKETING: <Megaphone className="h-5 w-5" />,
  CONTENT: <FileText className="h-5 w-5" />,
  CREATIVE_DESIGN: <Palette className="h-5 w-5" />,
  WEB_DEVELOPER: <Code2 className="h-5 w-5" />,
  HARDWARE: <Cpu className="h-5 w-5" />,
  SOFTWARE: <PenTool className="h-5 w-5" />,
};

export function PortfolioCard({
  portfolio,
  selected,
  onSelect,
  disabled,
}: {
  portfolio: Portfolio;
  selected: boolean;
  onSelect: (p: Portfolio) => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      onClick={() => onSelect(portfolio)}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full flex-col rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400',
        selected
          ? 'border-gold-500/60 bg-gold-500/10 shadow-gold-sm'
          : 'border-white/10 bg-ink-850/70 hover:border-gold-500/30 hover:bg-ink-800/80',
        disabled && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
            selected
              ? 'bg-gold-linear text-ink-900'
              : 'bg-white/5 text-gold-300 group-hover:bg-gold-500/15',
          )}
          aria-hidden="true"
        >
          {PORTFOLIO_ICONS[portfolio]}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold text-white sm:text-base">
            {PORTFOLIO_LABELS[portfolio]}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-mist-300 sm:text-sm">
            {PORTFOLIO_DESCRIPTIONS[portfolio]}
          </p>
        </div>
      </div>
      <span
        className={cn(
          'mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]',
          selected ? 'text-gold-300' : 'text-mist-400',
        )}
      >
        <span
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded-full border',
            selected ? 'border-gold-400 bg-gold-400' : 'border-white/25',
          )}
        >
          {selected ? (
            <span className="h-1.5 w-1.5 rounded-full bg-ink-900" aria-hidden="true" />
          ) : null}
        </span>
        {selected ? 'Selected' : 'Select portfolio'}
      </span>
    </motion.button>
  );
}

export function PortfolioList(props: {
  selected: Portfolio | null;
  onSelect: (p: Portfolio) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PORTFOLIO_ORDER.map((p) => (
        <PortfolioCard
          key={p}
          portfolio={p}
          selected={props.selected === p}
          onSelect={props.onSelect}
        />
      ))}
    </div>
  );
}

export function RadioCard({
  label,
  description,
  selected,
  onSelect,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400',
        selected
          ? 'border-gold-500/50 bg-gold-500/10 shadow-gold-sm'
          : 'border-white/10 bg-ink-850/60 hover:border-white/20 hover:bg-ink-800/70',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition',
          selected ? 'border-gold-400' : 'border-white/30',
        )}
        style={{ height: '18px', width: '18px' }}
        aria-hidden="true"
      >
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-gold-400" /> : null}
      </span>
      <span className="min-w-0">
        <span className={cn('block text-sm font-semibold', selected ? 'text-gold-200' : 'text-white')}>
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-xs text-mist-300">{description}</span>
        ) : null}
      </span>
    </button>
  );
}
