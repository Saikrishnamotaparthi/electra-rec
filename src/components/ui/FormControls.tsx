import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils';

const fieldBase =
  'w-full rounded-xl border bg-ink-850/80 px-3.5 text-sm text-white placeholder:text-mist-400 shadow-card transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/60 disabled:opacity-60';

const stateBorder = {
  default: 'border-white/10 hover:border-white/20',
  error: 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-400/60',
};

export interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
  counter?: { current: number; max: number };
}

export function FieldShell({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
  className,
  counter,
}: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-mist-100">
          {label}
          {required ? (
            <span className="ml-0.5 text-gold-400" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {counter ? (
          <span
            className={cn(
              'font-mono text-[11px]',
              counter.current > counter.max ? 'text-rose-400' : 'text-mist-400',
            )}
            aria-label={`${counter.current} of ${counter.max} characters`}
          >
            {counter.current}/{counter.max}
          </span>
        ) : null}
      </div>
      {children}
      {hint && !error ? <p className="text-xs text-mist-400">{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="flex items-start gap-1.5 text-xs font-medium text-rose-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, containerClassName, id, required, ...rest }, ref) => {
    const inputId = id ?? (rest.name ? `input-${rest.name}` : undefined);
    return (
      <FieldShell
        label={label}
        htmlFor={inputId ?? `field-${label.replace(/\s+/g, '-').toLowerCase()}`}
        error={error}
        required={required}
        hint={hint}
        className={containerClassName}
      >
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          className={cn(fieldBase, error ? stateBorder.error : stateBorder.default, 'h-12', className)}
          {...rest}
        />
      </FieldShell>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  counter?: { current: number; max: number };
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, hint, counter, className, containerClassName, id, required, ...rest },
    ref,
  ) => {
    const inputId = id ?? (rest.name ? `input-${rest.name}` : undefined);
    return (
      <FieldShell
        label={label}
        htmlFor={inputId ?? `field-${label.replace(/\s+/g, '-').toLowerCase()}`}
        error={error}
        required={required}
        hint={hint}
        counter={counter}
        className={containerClassName}
      >
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          className={cn(
            fieldBase,
            error ? stateBorder.error : stateBorder.default,
            'min-h-[120px] resize-y py-3 leading-relaxed',
            className,
          )}
          {...rest}
        />
      </FieldShell>
    );
  },
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  containerClassName?: string;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      className,
      containerClassName,
      id,
      required,
      children,
      ...rest
    },
    ref,
  ) => {
    const inputId = id ?? (rest.name ? `select-${rest.name}` : undefined);
    return (
      <FieldShell
        label={label}
        htmlFor={inputId ?? `field-${label.replace(/\s+/g, '-').toLowerCase()}`}
        error={error}
        required={required}
        hint={hint}
        className={containerClassName}
      >
        <select
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          className={cn(
            fieldBase,
            error ? stateBorder.error : stateBorder.default,
            'h-12 appearance-none bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-10',
            className,
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23A8BBBE' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-ink-850 text-white">
              {opt.label}
            </option>
          ))}
          {children}
        </select>
      </FieldShell>
    );
  },
);
Select.displayName = 'Select';
