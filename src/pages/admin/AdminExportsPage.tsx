import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard, EmptyState } from '@/components/ui/Misc';
import { useToast } from '@/components/shared/Toast';
import { fetchAllForExport } from '@/services/applicationsService';
import {
  exportAllApplications,
  exportDomain,
} from '@/services/excelExport';
import { PORTFOLIO_ORDER, PORTFOLIO_SHORT_LABELS, RECRUITMENT_YEAR } from '@/constants';
import type { Portfolio } from '@/types';

export default function AdminExportsPage() {
  const { push } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const runExport = async (key: string, fn: (apps: Awaited<ReturnType<typeof fetchAllForExport>>) => void) => {
    if (exporting) return;
    setExporting(key);
    try {
      const apps = await fetchAllForExport();
      if (apps.length === 0) {
        push('info', 'Nothing to export', 'No applications found in Firestore yet.');
        return;
      }
      fn(apps);
      push('success', 'Export ready', 'Excel workbook downloaded successfully.');
    } catch (err) {
      push(
        'error',
        'Export failed',
        err instanceof Error ? err.message : 'Could not export applications.',
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Excel exports</h2>
        <p className="mt-1 text-sm text-mist-300">
          Download live application data from Firestore as branded Excel workbooks.
        </p>
      </div>

      <SectionCard
        title="Master workbook"
        subtitle={`G-ELECTRA-Recruitment-${RECRUITMENT_YEAR}.xlsx — all applications plus one sheet per portfolio team`}
      >
        <Button
          type="button"
          size="lg"
          onClick={() =>
            void runExport('all', (apps) => {
              exportAllApplications(apps);
            })
          }
          loading={exporting === 'all'}
          leftIcon={
            exporting === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )
          }
        >
          Export all applications
        </Button>
      </SectionCard>

      <SectionCard title="Per-portfolio exports" subtitle="One workbook per G-ELECTRA team">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PORTFOLIO_ORDER.map((p: Portfolio) => (
            <button
              key={p}
              type="button"
              onClick={() =>
                void runExport(p, (apps) => {
                  exportDomain(apps, p);
                })
              }
              disabled={Boolean(exporting)}
              className="group rounded-xl border border-white/10 bg-ink-900/50 p-4 text-left transition hover:border-gold-500/40 hover:bg-gold-500/5 disabled:opacity-50"
            >
              <p className="font-medium text-white">{PORTFOLIO_SHORT_LABELS[p]}</p>
              <p className="mt-1 text-xs text-mist-400">
                {exporting === p ? 'Preparing workbook…' : `G-ELECTRA-${p}-2026.xlsx`}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold-300">
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Notes">
        <ul className="list-disc space-y-2 pl-5 text-sm text-mist-300">
          <li>
            Exports include all non-archived applications currently stored in the Firestore{' '}
            <code className="text-gold-300">applications</code> collection.
          </li>
          <li>Use Filters on the Applications page if you need a subset — this page always exports the full dataset.</li>
          <li>File names follow the recruitment year branding used across the club.</li>
        </ul>
        {!exporting ? null : (
          <p className="mt-4 flex items-center gap-2 text-sm text-gold-300">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Export in progress…
          </p>
        )}
      </SectionCard>

      {exporting === null ? (
        <EmptyState
          icon={<FileSpreadsheet className="h-8 w-8" />}
          title="Ready when you are"
          description="Click any export button to pull live data from Firestore and download an Excel file."
        />
      ) : null}
    </div>
  );
}
