import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
};

type ToastContextValue = {
  push: (kind: ToastKind, title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = ++toastId;
      setItems((prev) => [...prev.slice(-3), { id, kind, title, description }]);
      window.setTimeout(() => remove(id), kind === 'error' ? 6000 : 4000);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-card backdrop-blur-md ${
                item.kind === 'success'
                  ? 'border-emerald-500/30 bg-ink-850/95 text-emerald-100'
                  : item.kind === 'error'
                    ? 'border-rose-500/30 bg-ink-850/95 text-rose-100'
                    : 'border-gold-500/30 bg-ink-850/95 text-gold-100'
              }`}
              role="status"
            >
              <span className="mt-0.5 shrink-0">
                {item.kind === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : item.kind === 'error' ? (
                  <XCircle className="h-5 w-5 text-rose-400" />
                ) : (
                  <Info className="h-5 w-5 text-gold-400" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-xs text-mist-200/90">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded-md p-1 text-mist-300 transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
